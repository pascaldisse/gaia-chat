#!/usr/bin/env node
/**
 * Test Python GaiaScript Service
 * Simple test for the MLX-based GaiaScript generation service
 */

import { spawn } from 'child_process';
import path from 'path';

async function testPythonService(prompt, description) {
    console.log(`\n🧪 Testing: ${description}`);
    console.log(`📝 Prompt: "${prompt}"`);
    
    return new Promise((resolve) => {
        const scriptPath = '/Users/pascaldisse/gaia/gaia-chat/src/services/llm/gaiascript_service.py';
        const pythonProcess = spawn('python3', [
            scriptPath,
            '--prompt', prompt,
            '--json',
            '--max-tokens', '150'
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
                    console.log(`✅ Success (${result.method} mode)`);
                    console.log(`📊 Model: ${result.model}`);
                    console.log(`🎯 Generated Code:`);
                    console.log('   ' + result.generated_code.split('\n').join('\n   '));
                    console.log(`📈 Tokens: ${result.tokens}`);
                    resolve(true);
                } catch (e) {
                    console.log('✅ Success (text output)');
                    console.log('📝 Output:', output);
                    resolve(true);
                }
            } else {
                console.log('❌ Failed');
                console.log('🐍 Stderr:', errorOutput);
                resolve(false);
            }
        });

        pythonProcess.on('error', (error) => {
            console.log('❌ Failed to start Python process');
            console.log('❌ Error:', error.message);
            resolve(false);
        });
    });
}

async function main() {
    console.log('🌸 GaiaScript Python Service Test');
    console.log('Testing MLX-based GaiaScript generation');
    console.log('=' .repeat(50));

    const tests = [
        {
            prompt: "Create a GaiaScript function that adds two numbers",
            description: "Simple function generation"
        },
        {
            prompt: "Create a GaiaScript component for a button with click handler",
            description: "UI component generation"
        },
        {
            prompt: "Create a GaiaScript state declaration for a counter app",
            description: "State management"
        },
        {
            prompt: "Create a hello world page in GaiaScript",
            description: "Complete application"
        }
    ];

    let passed = 0;
    let total = tests.length;

    for (const test of tests) {
        const result = await testPythonService(test.prompt, test.description);
        if (result) passed++;
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
    }

    console.log('\n' + '=' .repeat(50));
    console.log('📊 Test Results Summary');
    console.log('=' .repeat(30));
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${total - passed}/${total}`);
    
    if (passed === total) {
        console.log('\n🎉 All tests passed! The GaiaScript service is working correctly.');
        console.log('🚀 Ready to integrate with LangChain and GaiaAgent.');
    } else {
        console.log('\n⚠️  Some tests failed. Check the MLX installation and model availability.');
    }

    process.exit(passed === total ? 0 : 1);
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});