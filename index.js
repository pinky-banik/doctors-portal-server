const express = require ("express");
const cors = require('cors');
const { MongoClient, ServerApiVersion} = require('mongodb');


const app = express();
const PORT = process.env.PORT || 4000;


//middleware/

app.use(cors());
app.use(express.json());

const uri = "mongodb+srv://doctors-portal:1bfMh6ZFOc1GWcKZ@cluster0.5f7tq.mongodb.net/?retryWrites=true&w=majority"
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run (){
    try{
        await client.connect();
        console.log('database connected successfully');
        const database = client.db("Doctors-Portal");
        const servicesCollection = database.collection('Services');



        app.get('/services',async(req,res)=>{
            const query={};
            const cursor = servicesCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })
    }
    finally{

    }
}
run().catch(console.dir);



app.get('/',(req,res)=>{
    res.send('Hello World!')
});

app.listen(PORT, ()=>console.log(`server is running on Port ${PORT}`))