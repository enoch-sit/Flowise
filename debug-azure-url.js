const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const dbPath = path.join(__dirname, '.flowise', 'database.sqlite')
console.log('Checking database at:', dbPath)

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err)
        return
    }

    console.log('Connected to the database.\n')

    // Check all tables
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
            console.error('Error getting tables:', err)
            return
        }

        console.log('Tables in database:', tables.map((t) => t.name).join(', '))
        console.log('\n')

        // Check credentials table
        db.all('SELECT * FROM credential', (err, rows) => {
            if (err) {
                console.error('Error querying credentials:', err)
                return
            }

            console.log('=== All Credentials ===')
            rows.forEach((row) => {
                console.log('\nCredential:', row.name)
                console.log('ID:', row.id)
                console.log('Type:', row.credentialName)

                // Check if encrypted data contains the old URL
                if (row.encryptedData) {
                    const encData = row.encryptedData
                    if (encData.includes('aai02') || encData.includes('eduhk')) {
                        console.log('⚠️  FOUND OLD URL IN ENCRYPTED DATA!')
                        console.log('First 100 chars:', encData.substring(0, 100) + '...')
                    }

                    // Try to parse the encrypted data structure
                    try {
                        const parsed = JSON.parse(encData)
                        console.log('Encrypted data structure:', Object.keys(parsed))
                    } catch (e) {
                        console.log('Encrypted data is not JSON structure')
                    }
                }
            })
        })

        // Check chat_flow table
        db.all('SELECT id, name, flowData FROM chat_flow', (err, rows) => {
            if (err) {
                console.error('Error querying chat_flow:', err)
                return
            }

            console.log('\n\n=== Chat Flows ===')
            rows.forEach((row) => {
                console.log('\nFlow:', row.name)
                console.log('ID:', row.id)

                if (row.flowData) {
                    // Search for the old URL in the flow data
                    if (row.flowData.includes('aai02.eduhk.hk')) {
                        console.log('🚨 FOUND aai02.eduhk.hk IN THIS FLOW!')

                        // Try to parse and find the exact location
                        try {
                            const flowData = JSON.parse(row.flowData)

                            // Search in nodes
                            if (flowData.nodes) {
                                flowData.nodes.forEach((node) => {
                                    const nodeStr = JSON.stringify(node)
                                    if (nodeStr.includes('aai02.eduhk.hk')) {
                                        console.log('  Found in node:', node.data?.label || node.id)
                                        console.log('  Node type:', node.data?.name)

                                        // Check inputs
                                        if (node.data?.inputs) {
                                            Object.entries(node.data.inputs).forEach(([key, value]) => {
                                                if (typeof value === 'string' && value.includes('aai02')) {
                                                    console.log(`  ⚠️  Found in input "${key}":`, value)
                                                }
                                            })
                                        }
                                    }
                                })
                            }
                        } catch (e) {
                            console.log('  Error parsing flow data:', e.message)
                        }
                    }
                }
            })

            // Check agentflow table if it exists
            db.all('SELECT id, name, flowData FROM agentflow', (err, rows) => {
                if (err) {
                    console.log('\nNo agentflow table found (this is normal for some versions)')
                } else {
                    console.log('\n\n=== Agent Flows ===')
                    rows.forEach((row) => {
                        console.log('\nAgent Flow:', row.name)
                        console.log('ID:', row.id)

                        if (row.flowData && row.flowData.includes('aai02.eduhk.hk')) {
                            console.log('🚨 FOUND aai02.eduhk.hk IN THIS AGENT FLOW!')
                        }
                    })
                }

                db.close()
                console.log('\n✅ Database inspection complete!')
            })
        })
    })
})
