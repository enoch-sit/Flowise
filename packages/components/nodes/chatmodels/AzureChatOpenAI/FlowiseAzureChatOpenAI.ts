import { AzureChatOpenAI as LangchainAzureChatOpenAI, OpenAIChatInput, AzureOpenAIInput, ClientOptions } from '@langchain/openai'
import { IMultiModalOption, IVisionChatModal } from '../../../src'
import { BaseChatModelParams } from '@langchain/core/language_models/chat_models'

export class AzureChatOpenAI extends LangchainAzureChatOpenAI implements IVisionChatModal {
    configuredModel: string
    configuredMaxToken?: number
    multiModalOption: IMultiModalOption
    id: string

    constructor(
        id: string,
        fields?: Partial<OpenAIChatInput> &
            Partial<AzureOpenAIInput> & {
                openAIApiKey?: string
                openAIApiVersion?: string
                openAIBasePath?: string
                deploymentName?: string
            } & BaseChatModelParams & {
                configuration?: ClientOptions
            }
    ) {
        // DEBUG: Log constructor parameters before calling super
        console.log('🔍 [AZURE DEBUG] FlowiseAzureChatOpenAI Constructor called with:')
        console.log('  - id:', id)
        console.log('  - fields.azureOpenAIApiKey:', fields?.azureOpenAIApiKey ? '***PRESENT***' : '❌ MISSING')
        console.log('  - fields.azureOpenAIApiInstanceName:', fields?.azureOpenAIApiInstanceName || '❌ MISSING/EMPTY')
        console.log('  - fields.azureOpenAIApiDeploymentName:', fields?.azureOpenAIApiDeploymentName || '❌ MISSING/EMPTY')
        console.log('  - fields.azureOpenAIApiVersion:', fields?.azureOpenAIApiVersion || '❌ MISSING/EMPTY')
        console.log('  - fields.azureOpenAIBasePath:', fields?.azureOpenAIBasePath || '❌ MISSING/EMPTY')
        console.log('  - fields.modelName:', fields?.modelName || '❌ MISSING/EMPTY')

        // Construct what the URL would be
        const constructedURL = fields?.azureOpenAIApiInstanceName
            ? `https://${fields.azureOpenAIApiInstanceName}.openai.azure.com/`
            : 'INVALID - NO INSTANCE NAME'
        console.log('  - Constructed URL would be:', constructedURL)
        console.log(
            '  - Complete fields object:',
            JSON.stringify(
                fields,
                (key, value) => {
                    if (key.toLowerCase().includes('key')) return '***HIDDEN***'
                    return value
                },
                2
            )
        )

        try {
            super(fields)
            console.log('✅ [AZURE DEBUG] FlowiseAzureChatOpenAI super() constructor completed successfully')
        } catch (error) {
            console.error('❌ [AZURE DEBUG] Error in FlowiseAzureChatOpenAI super() constructor:', error)
            console.error('  - Error message:', (error as Error).message)
            console.error('  - Error stack:', (error as Error).stack)
            throw error
        }

        this.id = id
        this.configuredModel = fields?.modelName ?? ''
        this.configuredMaxToken = fields?.maxTokens
    }

    revertToOriginalModel(): void {
        this.modelName = this.configuredModel
        this.maxTokens = this.configuredMaxToken
    }

    setMultiModalOption(multiModalOption: IMultiModalOption): void {
        this.multiModalOption = multiModalOption
    }

    setVisionModel(): void {
        // pass
    }

    // Override _generate to add debug logging for API calls
    async _generate(messages: any[], options?: any, runManager?: any): Promise<any> {
        console.log('🔍 [AZURE DEBUG] _generate method called')
        console.log('  - Model instance properties:')
        console.log('    - azureOpenAIApiInstanceName:', (this as any).azureOpenAIApiInstanceName)
        console.log('    - azureOpenAIApiDeploymentName:', (this as any).azureOpenAIApiDeploymentName)
        console.log('    - azureOpenAIApiVersion:', (this as any).azureOpenAIApiVersion)
        console.log('    - azureOpenAIBasePath:', (this as any).azureOpenAIBasePath)
        console.log('    - modelName:', this.modelName)

        // Check if client exists and log its configuration
        if ((this as any).client) {
            console.log('  - OpenAI Client configuration:')
            console.log('    - baseURL:', (this as any).client.baseURL)
            console.log('    - apiKey exists:', !!(this as any).client.apiKey)
            console.log('    - defaultQuery:', (this as any).client.defaultQuery)
        } else {
            console.log('  - ❌ No OpenAI client found')
        }

        try {
            const result = await super._generate(messages, options, runManager)
            console.log('✅ [AZURE DEBUG] _generate completed successfully')
            return result
        } catch (error) {
            console.error('❌ [AZURE DEBUG] Error in _generate:', error)
            console.error('  - Error type:', error?.constructor?.name)
            console.error('  - Error message:', (error as Error).message)

            // Detailed URL error analysis
            if ((error as Error).message.includes('Invalid URL')) {
                console.error('🚨 [AZURE DEBUG] INVALID URL ERROR DETECTED!')
                console.error('  - Current instance properties:')
                console.error('    - azureOpenAIApiInstanceName:', (this as any).azureOpenAIApiInstanceName)
                console.error('    - azureOpenAIApiDeploymentName:', (this as any).azureOpenAIApiDeploymentName)
                console.error('    - azureOpenAIApiVersion:', (this as any).azureOpenAIApiVersion)
                console.error('    - azureOpenAIBasePath:', (this as any).azureOpenAIBasePath)
                console.error('    - modelName:', this.modelName)

                if ((this as any).client) {
                    console.error('  - Client baseURL that caused error:', (this as any).client.baseURL)
                    console.error('  - Full client object keys:', Object.keys((this as any).client))
                }
            }

            throw error
        }
    }
}
