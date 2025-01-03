class Bottleneck {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
    }

    async add(asyncFunction) {
        return new Promise((resolve, reject) => {
            this.queue.push({ asyncFunction, resolve, reject });
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;

        const { asyncFunction, resolve, reject } = this.queue.shift();

        try {
            const result = await asyncFunction();
            resolve(result);
        } catch (error) {
            reject(error);
        } finally {
            this.isProcessing = false;
            this.processQueue();
        }
    }
}

module.exports = Bottleneck;