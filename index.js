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
        const bookingCollection = database.collection('Booking');
        

        /**
         * API naming Convention
         * app.get("/booking") //get all bookings in this collection. or get more than one or by filter
         * app.get("/booking/:id")  // get a specific booking
         * app.post("/booking") // add a new booking   
         * app.patch("/booking/:id") // update a single booking by matching id   
         * app.delete("/booking.:id") // delete a single booking by matching id  
        */


        app.post('/booking',async(req,res)=>{
            const booking = req.body;
            const query = {treatment: booking.treatment,date:booking.date,patient:booking.patient};
            const exists = await bookingCollection.findOne(query);
            if(exists){
                return res.send({success:false,booking:exists})
            };
            const result = await bookingCollection.insertOne(booking);
            return res.send({success:true,result});
        });

        


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