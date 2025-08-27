const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')

const dbPath = path.join(__dirname, '.flowise', 'database.sqlite')
const encryptionKeyPath = path.join(__dirname, '.flowise', 'encryption.key')

console.log('Checking database at:', dbPath)
console.log('Encryption key at:', encryptionKeyPath)

// Read encryption key
let encryptionKey = null
try {
    encryptionKey = fs.readFileSync(encryptionKeyPath, 'utf8')
    console.log('Encryption key loaded, length:', encryptionKey.length)
} catch (err) {
    console.log('Could not read encryption key:', err.message)
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err)
        return
    }

    console.log('Connected to the database.\n')

    // Get the specific Azure credential
    db.get("SELECT * FROM credential WHERE id = '26890895-ddb3-45df-bb6b-cda6bddd2c79'", (err, row) => {
        if (err) {
            console.error('Error querying credential:', err)
            return
        }

        if (row) {
            console.log('=== Azure Credential "Strange" ===')
            console.log('ID:', row.id)
            console.log('Name:', row.name)
            console.log('Type:', row.credentialName)
            console.log('Created:', row.createdDate)
            console.log('Updated:', row.updatedDate)

            if (row.encryptedData) {
                console.log('\nEncrypted Data Info:')
                console.log('Length:', row.encryptedData.length)
                console.log('First 50 chars:', row.encryptedData.substring(0, 50))
                console.log('Last 50 chars:', row.encryptedData.substring(row.encryptedData.length - 50))

                // Check if it contains the old URL in any form
                if (row.encryptedData.includes('aai02') || row.encryptedData.includes('eduhk')) {
                    console.log('🚨 CONTAINS OLD URL FRAGMENTS!')

                    // Try to find the exact position
                    const aai02Index = row.encryptedData.indexOf('aai02')
                    const eduhkIndex = row.encryptedData.indexOf('eduhk')

                    if (aai02Index !== -1) {
                        console.log('Found "aai02" at position:', aai02Index)
                        console.log('Context:', row.encryptedData.substring(Math.max(0, aai02Index - 20), aai02Index + 50))
                    }

                    if (eduhkIndex !== -1) {
                        console.log('Found "eduhk" at position:', eduhkIndex)
                        console.log('Context:', row.encryptedData.substring(Math.max(0, eduhkIndex - 20), eduhkIndex + 50))
                    }
                }

                // Try to parse as JSON
                try {
                    const parsed = JSON.parse(row.encryptedData)
                    console.log('\nParsed as JSON successfully!')
                    console.log('Keys:', Object.keys(parsed))

                    // Look for URL-related fields
                    Object.entries(parsed).forEach(([key, value]) => {
                        if (
                            typeof value === 'string' &&
                            (value.includes('aai02') || value.includes('eduhk') || value.includes('endpoint') || value.includes('url'))
                        ) {
                            console.log(`🔍 Suspicious field "${key}":`, value)
                        }
                    })
                } catch (e) {
                    console.log('\nNot valid JSON, likely encrypted')

                    // Try common encryption patterns
                    if (row.encryptedData.includes(':')) {
                        console.log('Contains colons, might be structured encrypted data')
                        const parts = row.encryptedData.split(':')
                        console.log('Parts:', parts.length)

                        parts.forEach((part, index) => {
                            if (part.includes('aai02') || part.includes('eduhk')) {
                                console.log(`🚨 Part ${index} contains old URL:`, part)
                            }
                        })
                    }
                }
            }
        } else {
            console.log('Credential not found!')
        }

        // Also check if this credential is being used in any flows
        db.all("SELECT id, name, flowData FROM chat_flow WHERE flowData LIKE '%26890895-ddb3-45df-bb6b-cda6bddd2c79%'", (err, rows) => {
            if (err) {
                console.error('Error checking flow usage:', err)
                return
            }

            console.log('\n=== Flows using this credential ===')
            if (rows.length > 0) {
                rows.forEach((flow) => {
                    console.log(`Flow "${flow.name}" (${flow.id}) uses this credential`)
                })
            } else {
                console.log('No flows found using this credential')
            }

            db.close()
            console.log('\n✅ Detailed credential inspection complete!')
        })
    })
})
