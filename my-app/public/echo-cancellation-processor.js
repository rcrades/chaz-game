class EchoCancellationProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2048;
    this.delayBuffer = new Float32Array(this.bufferSize);
    this.delayIndex = 0;
    console.log('EchoCancellationProcessor constructed');
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !output || input.length === 0 || output.length === 0) {
      console.error('Invalid input or output in EchoCancellationProcessor');
      return true;
    }

    for (let channel = 0; channel < input.length; channel++) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];

      if (!inputChannel || !outputChannel) {
        console.error('Invalid input or output channel in EchoCancellationProcessor');
        continue;
      }

      for (let i = 0; i < inputChannel.length; i++) {
        const delayedSample = this.delayBuffer[this.delayIndex];
        outputChannel[i] = inputChannel[i] - 0.5 * delayedSample;
        this.delayBuffer[this.delayIndex] = inputChannel[i];
        this.delayIndex = (this.delayIndex + 1) % this.bufferSize;
      }
    }

    return true;
  }
}

try {
  console.log('Attempting to register EchoCancellationProcessor');
  registerProcessor('echo-cancellation-processor', EchoCancellationProcessor);
  console.log('EchoCancellationProcessor registered successfully');
} catch (error) {
  console.error('Failed to register EchoCancellationProcessor:', error);
}

