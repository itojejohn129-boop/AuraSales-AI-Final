/**
 * Voice Capabilities Test Utility
 * Tests browser support for Web Speech API (both input and output)
 * Results logged to browser console
 */

interface VoiceCapabilities {
  speechRecognition: boolean;
  speechSynthesis: boolean;
  features: {
    webkit: boolean;
    standard: boolean;
  };
}

/**
 * Run comprehensive voice capability tests
 * Logs results to browser console with formatted output
 */
export function testVoiceCapabilities(): VoiceCapabilities {
  console.group("AURA VOICE CAPABILITIES TEST");

  // Test 1: Speech Recognition (Input)
  console.group("1️⃣ Speech Recognition (Voice Input)");
  
  let speechRecognitionSupported = false;
  const WebkitSpeechRecognition = (window as any).webkitSpeechRecognition;
  const StandardSpeechRecognition = (window as any).SpeechRecognition;
  
  const hasWebkit = !!WebkitSpeechRecognition;
  const hasStandard = !!StandardSpeechRecognition;
  
  if (hasWebkit || hasStandard) {
    speechRecognitionSupported = true;
    console.log("✅ Voice Input: SUPPORTED");
    console.log(`   └─ WebKit API: ${hasWebkit ? "✓" : "✗"}`);
    console.log(`   └─ Standard API: ${hasStandard ? "✓" : "✗"}`);
    console.log(`   └─ Implementation: ${hasStandard ? "Standard (SpeechRecognition)" : "Webkit (webkitSpeechRecognition)"}`);
  } else {
    console.error("❌ Voice Input: NOT SUPPORTED");
    console.log("   └─ This browser does not support Web Speech Recognition");
    console.log("   └─ Supported in: Chrome, Edge, Safari, Opera");
  }
  
  // Try to initialize speech recognition
  try {
    const SpeechRecognition = StandardSpeechRecognition || WebkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      console.log("   └─ SpeechRecognition instance: ✓ Created successfully");
      recognition.abort(); // Clean up
    }
  } catch (e: any) {
    console.warn("   └─ SpeechRecognition instance: ✗ Error creating instance", e?.message);
  }
  
  console.groupEnd();

  // Test 2: Speech Synthesis (Text-to-Speech Output)
  console.group("2️⃣ Speech Synthesis (Text-to-Speech Output)");
  
  let speechSynthesisSupported = false;
  const hasSpeechSynthesis = !!window.speechSynthesis;
  
  if (hasSpeechSynthesis) {
    speechSynthesisSupported = true;
    console.log("✅ Voice Output: SUPPORTED (Text-to-Speech)");
    
    // Try to create a test utterance
    try {
      const testUtterance = new SpeechSynthesisUtterance("Test");
      console.log("   └─ SpeechSynthesisUtterance instance: ✓ Created successfully");
      
      // Check properties
      const hasProps = 
        testUtterance.hasOwnProperty("rate") &&
        testUtterance.hasOwnProperty("pitch") &&
        testUtterance.hasOwnProperty("volume");
      
      if (hasProps) {
        console.log("   └─ Utterance properties: ✓ All available");
        console.log(`      • Default rate: ${testUtterance.rate}`);
        console.log(`      • Default pitch: ${testUtterance.pitch}`);
        console.log(`      • Default volume: ${testUtterance.volume}`);
      }
    } catch (e: any) {
      console.warn("   └─ SpeechSynthesisUtterance instance: ✗ Error creating instance", e?.message);
    }
    
    // Check available voices
    const voices = window.speechSynthesis.getVoices();
    console.log(`   └─ Available voices: ${voices.length} languages supported`);
  } else {
    console.error("❌ Voice Output: NOT SUPPORTED");
    console.log("   └─ This browser does not support Web Speech Synthesis");
    console.log("   └─ Supported in: Chrome, Edge, Safari, Firefox");
  }
  
  console.groupEnd();

  // Summary
  console.group("📊 SUMMARY");
  
  const summaryEmoji = speechRecognitionSupported && speechSynthesisSupported ? "✅" : "⚠️";
  console.log(`${summaryEmoji} Voice Input: ${speechRecognitionSupported ? "SUPPORTED" : "NOT SUPPORTED"}`);
  console.log(`${speechSynthesisSupported ? "✅" : "⚠️"} Voice Output: ${speechSynthesisSupported ? "SUPPORTED" : "NOT SUPPORTED"}`);
  
  if (speechRecognitionSupported && speechSynthesisSupported) {
    console.log("✅ Full voice capabilities available!");
  } else {
    console.log("⚠️  Some voice features are unavailable. Check browser compatibility.");
  }
  
  console.log("\n📝 For detailed info about voice features, check:");
  console.log("   • Voice input: window.SpeechRecognition or window.webkitSpeechRecognition");
  console.log("   • Voice output: window.speechSynthesis");
  console.log("   • Text generation: window.speechSynthesis.getVoices()");
  
  console.groupEnd();

  console.groupEnd(); // Close main group

  return {
    speechRecognition: speechRecognitionSupported,
    speechSynthesis: speechSynthesisSupported,
    features: {
      webkit: hasWebkit,
      standard: hasStandard || hasSpeechSynthesis
    }
  };
}

/**
 * Test backend connectivity to Hugging Face API
 */
async function testBackendConnectivity(): Promise<void> {
  try {
    const response = await fetch("/api/test-hf", {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    const data = await response.json();

    if (response.ok) {
      console.group("✅ Backend Test Results");
      console.log(data.message);
      console.log("Details:", {
        elapsed: data.data?.elapsed + "ms",
        contentLength: data.data?.contentLength,
        preview: data.data?.preview
      });
      console.groupEnd();
    } else if (response.status === 503) {
      console.group("⏳ Backend Test Results");
      console.log(data.message);
      console.log("Details:", data.details);
      console.groupEnd();
    } else {
      console.group("❌ Backend Test Results");
      console.error(data.message);
      console.log("Details:", data.details);
      console.groupEnd();
    }
  } catch (error: any) {
    console.error("❌ Backend connectivity test failed:", error?.message);
  }
}

/**
 * Manual test trigger for backend
 * Call from console: window.__testAuraBackend()
 */
if (typeof window !== "undefined") {
  (window as any).__testAuraBackend = testBackendConnectivity;
  (window as any).__testAuraVoice = testVoiceCapabilities;
}
