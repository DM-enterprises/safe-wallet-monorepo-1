const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { XMLParser, XMLBuilder } = require('fast-xml-parser')

// Compute SHA256 hash and return base64-encoded integrity value
function computeIntegrity(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`Warning: File not found - ${filePath}`)
    return null
  }

  const fileBuffer = fs.readFileSync(filePath)
  const hash = crypto.createHash('sha256').update(fileBuffer).digest('base64')
  return `sha256-${hash}`
}

// Recursively find all HTML files in a directory
function findHtmlFiles(dir) {
  let htmlFiles = []
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file)
    if (fs.statSync(fullPath).isDirectory()) {
      htmlFiles = htmlFiles.concat(findHtmlFiles(fullPath))
    } else if (file.endsWith('.html')) {
      htmlFiles.push(fullPath)
    }
  })
  return htmlFiles
}

// Process each HTML file
function processHtmlFile(htmlFile) {
  console.log(`Processing: ${htmlFile}`)

  // Read and parse HTML
  const htmlContent = fs.readFileSync(htmlFile, 'utf8')
  const htmlParsingOptions = {
    ignoreAttributes: false,
    preserveOrder: true,
    unpairedTags: ['hr', 'br', 'link', 'meta'],
    stopNodes: ['*.pre', '*.script'],
    processEntities: true,
    htmlEntities: true,
  }
  const parser = new XMLParser(htmlParsingOptions)
  let jsonObj = parser.parse(htmlContent)

  // Find and update <script> tags
  const updateScripts = (node) => {
    if (Array.isArray(node)) {
      node.forEach(updateScripts)
    } else if (typeof node === 'object') {
      if (node.script) {
        let scripts = Array.isArray(node.script) ? node.script : [node.script]

        scripts.forEach((script) => {
          if (script['@_src']) {
            const scriptPath = path.join('out', script['@_src'])
            const integrityHash = computeIntegrity(scriptPath)
            if (integrityHash) {
              script['@_integrity'] = integrityHash
              script['@_crossorigin'] = 'anonymous'
            }
          }
        })
      }

      // Recursively process other elements
      Object.values(node).forEach(updateScripts)
    }
  }

  updateScripts(jsonObj)

  console.log('JSON Object after modifying', JSON.stringify(jsonObj))

  // Convert JSON back to HTML
  const htmlBuilderOptions = {
    ignoreAttributes: false,
    format: true,
    preserveOrder: true,
    suppressEmptyNode: true,
    stopNodes: ['*.pre', '*.script'],
    unpairedTags: ['hr', 'br'],
  }
  const builder = new XMLBuilder(htmlBuilderOptions)
  const updatedHtml = builder.build(jsonObj)

  // Write updated HTML back to the file
  fs.writeFileSync(htmlFile, updatedHtml, 'utf8')
}

// Run script
const htmlFiles = findHtmlFiles('out') // Start from current directory
htmlFiles.forEach(processHtmlFile)

console.log('Integrity attributes updated successfully.')
