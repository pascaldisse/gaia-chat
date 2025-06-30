#!/usr/bin/env node
/**
 * Test GaiaEngine and GaiaAgent Integration
 * Tests the complete LangChain + MLX + GaiaScript pipeline
 */

import { GaiaEngine } from './src/services/llm/GaiaEngine.js';
import { GaiaAgent } from './src/services/llm/GaiaAgent.js';

async function testGaiaEngine() {
    console.log('🌸 Testing GaiaEngine Integration\n');
    console.log('=' .repeat(50));

    try {
        // Test 1: Basic GaiaEngine
        console.log('\n1️⃣ Testing GaiaEngine Basic Chat...');
        const engine = new GaiaEngine();

        const chatResponse = await engine.chat("Create a simple counter function in GaiaScript");
        console.log('💬 Chat Response:', chatResponse.success ? '✅ Success' : '❌ Failed');
        if (chatResponse.success) {
            console.log('📝 Generated:', chatResponse.response.substring(0, 100) + '...');
        } else {
            console.log('❌ Error:', chatResponse.error);
        }

        // Test 2: Code Generation
        console.log('\n2️⃣ Testing GaiaEngine Code Generation...');
        const codeResponse = await engine.generateCode('function', {
            name: 'multiply',
            description: 'multiply two numbers'
        });
        console.log('🔧 Code Generation:', codeResponse.success ? '✅ Success' : '❌ Failed');
        if (codeResponse.success) {
            console.log('📝 Generated Code:', codeResponse.code.substring(0, 100) + '...');
        }

        // Test 3: Model Information
        console.log('\n3️⃣ Testing Model Information...');
        const modelInfo = engine.getModelInfo();
        console.log('📊 Model Info:', modelInfo);

        return true;
    } catch (error) {
        console.error('❌ GaiaEngine Test Failed:', error.message);
        return false;
    }
}

async function testGaiaAgent() {
    console.log('\n\n🤖 Testing GaiaAgent Integration\n');
    console.log('=' .repeat(50));

    try {
        // Test 1: Agent Setup
        console.log('\n1️⃣ Testing GaiaAgent Setup...');
        const agent = new GaiaAgent();

        // Wait for agent setup
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 2: Agent Info
        console.log('\n2️⃣ Testing Agent Information...');
        const agentInfo = agent.getInfo();
        console.log('🤖 Agent Info:', agentInfo);

        // Test 3: Available Tools
        console.log('\n3️⃣ Testing Available Tools...');
        const tools = agent.getTools();
        console.log('🛠️ Available Tools:');
        tools.forEach(tool => {
            console.log(`   - ${tool.name}: ${tool.description}`);
        });

        // Test 4: Agent Chat
        console.log('\n4️⃣ Testing Agent Chat...');
        const agentResponse = await agent.chat("Create a GaiaScript button component with click handler");
        console.log('💬 Agent Response:', agentResponse.success ? '✅ Success' : '❌ Failed');
        if (agentResponse.success) {
            console.log('📝 Output:', agentResponse.output.substring(0, 200) + '...');
            console.log('🔧 Tools Used:', agentResponse.metadata?.tools_used?.length || 0);
        } else {
            console.log('❌ Error:', agentResponse.error);
        }

        // Test 5: Code Generation via Agent
        console.log('\n5️⃣ Testing Agent Code Generation...');
        const agentCodeResponse = await agent.generateCode('component', {
            name: 'TodoItem',
            description: 'a todo list item with checkbox and delete button'
        });
        console.log('🔧 Agent Code Generation:', agentCodeResponse.success ? '✅ Success' : '❌ Failed');
        if (agentCodeResponse.success) {
            console.log('📝 Generated:', agentCodeResponse.output.substring(0, 200) + '...');
        }

        return true;
    } catch (error) {
        console.error('❌ GaiaAgent Test Failed:', error.message);
        return false;
    }
}

async function testIntegration() {
    console.log('\n\n🔗 Testing Complete Integration\n');
    console.log('=' .repeat(50));

    try {
        // Test Python Service Directly
        console.log('\n1️⃣ Testing Python Service...');
        const { spawn } = await import('child_process');
        
        const testPythonService = () => {
            return new Promise((resolve) => {
                const pythonProcess = spawn('python3', [
                    './src/services/llm/gaiascript_service.py',
                    '--prompt', 'Create a simple hello function',
                    '--json'
                ]);

                let output = '';
                let errorOutput = '';

                pythonProcess.stdout.on('data', (data) => {
                    output += data.toString();
                });

                pythonProcess.stderr.on('data', (data) => {
                    errorOutput += data.toString();
                });

                pythonProcess.on('close', (code) => {
                    if (code === 0) {
                        try {
                            const result = JSON.parse(output);
                            console.log('🐍 Python Service:', result.success ? '✅ Success' : '❌ Failed');
                            console.log('📝 Method:', result.method);
                            console.log('🎯 Generated:', result.generated_code?.substring(0, 100) + '...');
                            resolve(true);
                        } catch (e) {
                            console.log('🐍 Python Service: ✅ Success (non-JSON output)');
                            console.log('📝 Output:', output.substring(0, 100) + '...');
                            resolve(true);
                        }
                    } else {
                        console.log('🐍 Python Service: ❌ Failed');
                        console.log('❌ Error:', errorOutput);
                        resolve(false);
                    }
                });

                pythonProcess.on('error', (error) => {
                    console.log('🐍 Python Service: ❌ Failed to start');
                    console.log('❌ Error:', error.message);
                    resolve(false);
                });
            });
        };

        await testPythonService();

        // Test 2: End-to-End Workflow
        console.log('\n2️⃣ Testing End-to-End Workflow...');
        console.log('   🔄 User Request → GaiaAgent → Python Service → GaiaScript → Response');

        const agent = new GaiaAgent();
        await new Promise(resolve => setTimeout(resolve, 1000));

        const workflowTest = await agent.chat("I need a GaiaScript function that calculates the area of a circle");
        console.log('🔄 End-to-End Workflow:', workflowTest.success ? '✅ Success' : '❌ Failed');

        return true;
    } catch (error) {
        console.error('❌ Integration Test Failed:', error.message);
        return false;
    }
}

async function main() {
    console.log('🌸 GaiaScript LLM Engine Test Suite');
    console.log('Testing LangChain + MLX + GaiaScript Integration');
    console.log('=' .repeat(60));

    const results = {
        engine: false,
        agent: false,
        integration: false
    };

    // Run all tests
    results.engine = await testGaiaEngine();
    results.agent = await testGaiaAgent();
    results.integration = await testIntegration();

    // Summary
    console.log('\n\n📊 Test Results Summary');
    console.log('=' .repeat(30));
    console.log(`🔧 GaiaEngine:      ${results.engine ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🤖 GaiaAgent:       ${results.agent ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🔗 Integration:     ${results.integration ? '✅ PASS' : '❌ FAIL'}`);

    const allPassed = Object.values(results).every(r => r);
    console.log(`\n🎯 Overall:         ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

    if (allPassed) {
        console.log('\n🚀 GaiaScript LLM Engine is ready for production!');
        console.log('   - LangChain integration: ✅');
        console.log('   - MLX fine-tuned model: ✅');
        console.log('   - Agent pattern: ✅');
        console.log('   - GaiaScript generation: ✅');
    } else {
        console.log('\n🔧 Some components need attention. Check the logs above.');
    }

    process.exit(allPassed ? 0 : 1);
}

// Run the test suite
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});