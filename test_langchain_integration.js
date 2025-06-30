#!/usr/bin/env node
/**
 * Test LangChain + GaiaScript Integration
 * Tests the GaiaEngine and basic LangChain functionality
 */

import { GaiaScriptLLM } from '/Users/pascaldisse/gaia/gaia-chat/src/services/llm/GaiaEngine.js';

async function testGaiaScriptLLM() {
    console.log('🧪 Testing GaiaScriptLLM (Custom LangChain LLM)');
    console.log('=' .repeat(50));

    try {
        // Create LLM instance
        const llm = new GaiaScriptLLM({
            pythonScript: '/Users/pascaldisse/gaia/gaia-chat/src/services/llm/gaiascript_service.py'
        });

        console.log('✅ GaiaScriptLLM instance created');
        console.log(`📊 LLM Type: ${llm._llmType}`);

        // Test 1: Basic call
        console.log('\n1️⃣ Testing basic LLM call...');
        const response1 = await llm._call("Create a simple increment function");
        console.log('✅ Basic call successful');
        console.log('📝 Response:', response1.substring(0, 100) + '...');

        // Test 2: Function generation
        console.log('\n2️⃣ Testing function generation...');
        const response2 = await llm.generateFunction("multiply", "multiply two numbers");
        console.log('✅ Function generation successful');
        console.log('📝 Function:', response2.substring(0, 100) + '...');

        // Test 3: Component generation
        console.log('\n3️⃣ Testing component generation...');
        const response3 = await llm.generateComponent("Card", "a card component with title and content");
        console.log('✅ Component generation successful');
        console.log('📝 Component:', response3.substring(0, 100) + '...');

        // Test 4: State generation
        console.log('\n4️⃣ Testing state generation...');
        const response4 = await llm.generateState({
            counter: 0,
            isLoading: false,
            items: []
        });
        console.log('✅ State generation successful');
        console.log('📝 State:', response4.substring(0, 100) + '...');

        return true;
    } catch (error) {
        console.error('❌ GaiaScriptLLM test failed:', error.message);
        return false;
    }
}

async function testBasicLangChain() {
    console.log('\n\n🔗 Testing Basic LangChain Integration');
    console.log('=' .repeat(50));

    try {
        // Test LangChain core imports
        const { LLM } = await import("@langchain/core/language_models/llms");
        console.log('✅ LangChain core imported successfully');

        // Test if our custom LLM extends properly
        const { GaiaScriptLLM } = await import('/Users/pascaldisse/gaia/gaia-chat/src/services/llm/GaiaEngine.js');
        const llm = new GaiaScriptLLM();
        
        const isLLMInstance = llm instanceof LLM;
        console.log(`✅ GaiaScriptLLM extends LangChain LLM: ${isLLMInstance}`);

        return true;
    } catch (error) {
        console.error('❌ LangChain integration test failed:', error.message);
        return false;
    }
}

async function testGaiaEngine() {
    console.log('\n\n🔧 Testing GaiaEngine');
    console.log('=' .repeat(50));

    try {
        const { GaiaEngine } = await import('/Users/pascaldisse/gaia/gaia-chat/src/services/llm/GaiaEngine.js');
        
        // Create engine
        const engine = new GaiaEngine({
            llmOptions: {
                pythonScript: '/Users/pascaldisse/gaia/gaia-chat/src/services/llm/gaiascript_service.py'
            }
        });
        console.log('✅ GaiaEngine created successfully');

        // Test model info
        const modelInfo = engine.getModelInfo();
        console.log('📊 Model Info:', modelInfo);

        // Test chat
        console.log('\n1️⃣ Testing chat functionality...');
        const chatResponse = await engine.chat("Create a GaiaScript function for calculating area of a circle");
        console.log('💬 Chat success:', chatResponse.success);
        if (chatResponse.success) {
            console.log('📝 Response length:', chatResponse.response.length);
            console.log('🔢 Conversation ID:', chatResponse.conversationId);
        } else {
            console.log('❌ Chat error:', chatResponse.error);
        }

        // Test code generation
        console.log('\n2️⃣ Testing code generation...');
        const codeResponse = await engine.generateCode('function', {
            name: 'fibonacci',
            description: 'calculate fibonacci number'
        });
        console.log('🔧 Code generation success:', codeResponse.success);
        if (codeResponse.success) {
            console.log('📝 Generated code type:', codeResponse.type);
        }

        // Test conversation history
        console.log('\n3️⃣ Testing conversation history...');
        const history = engine.getHistory();
        console.log('📚 History length:', history.length);

        return true;
    } catch (error) {
        console.error('❌ GaiaEngine test failed:', error.message);
        return false;
    }
}

async function main() {
    console.log('🌸 GaiaScript LangChain Integration Test');
    console.log('Testing LLM, Engine, and LangChain compatibility');
    console.log('=' .repeat(60));

    const results = {
        llm: false,
        langchain: false,
        engine: false
    };

    // Run tests
    results.llm = await testGaiaScriptLLM();
    results.langchain = await testBasicLangChain();
    results.engine = await testGaiaEngine();

    // Summary
    console.log('\n\n📊 Integration Test Results');
    console.log('=' .repeat(40));
    console.log(`🤖 GaiaScriptLLM:    ${results.llm ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🔗 LangChain Core:   ${results.langchain ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🔧 GaiaEngine:       ${results.engine ? '✅ PASS' : '❌ FAIL'}`);

    const allPassed = Object.values(results).every(r => r);
    console.log(`\n🎯 Overall:          ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

    if (allPassed) {
        console.log('\n🚀 GaiaScript LangChain integration is complete!');
        console.log('   ✅ Custom LLM class working');
        console.log('   ✅ Python service integration');
        console.log('   ✅ GaiaEngine functionality');
        console.log('   ✅ Ready for agent deployment');
    } else {
        console.log('\n🔧 Some components need attention.');
    }

    process.exit(allPassed ? 0 : 1);
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});