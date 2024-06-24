import mongoose from 'mongoose';

const connectDb = async (): Promise<void> => {
    try {
        const mongoURL: string | undefined = process.env.DB_URL;
        if (!mongoURL) {
            throw new Error("MongoDB URL not provided");
        }
        
        const conn = await mongoose.connect(mongoURL);
        console.log(`Mongo DB Connected: ${conn.connection.host}`);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
};

export default connectDb; // Export connectDb as default
