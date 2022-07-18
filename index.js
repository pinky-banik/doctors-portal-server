const express = require ("express");
const cors = require('cors');
const { MongoClient, ServerApiVersion} = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 4000;


//middleware/

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5f7tq.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT (req,res,next){
    const authHeader = req.headers.authorization; //access the token
    if(!authHeader){   // checking if the token is exists
        return res.status(401).send({message :'unAuthorized access'}) //if not than just send a error message
    };
    const token = authHeader.split(' ')[1]; //when we send token from frontend than we wrote it like {Bearer (tokencode)},so that we are spliting the token to get the exact token
    
    //the below function we just copied from the docs and we use the env token to the middle to verify it, if it gets error that means the token didn't match which we give to frontend and get back from back end so that we give a status code 403 and a forbidden access message
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,function(err,decoded){
        if (err){
            return res.status (403).send({message:'Forbidden access'})
        }
        req.decoded = decoded; //and if there is no err than we just get the "decoded" which means this is result . in which api we will use this verify function,, so in this project case we actually get the email as decoded here
        next(); 
        //here we call next funtion at last of our function because.. we use verifyTOken as middle tier function so after call the verifyToken fuction ,the it moves to next to the other functions
    });

}


async function run (){
    try{
        await client.connect();
        console.log('database connected successfully');
        const database = client.db("Doctors-Portal");
        const servicesCollection = database.collection('Services');
        const bookingCollection = database.collection('Booking');
        const userCollection = database.collection('Users');
        

        /**
         * API naming Convention
         * app.get("/booking") //get all bookings in this collection. or get more than one or by filter
         * app.get("/booking/:id")  // get a specific booking
         * app.post("/booking") // add a new booking   
         * app.patch("/booking/:id") // update a single booking by matching id   
         * app.delete("/booking.:id") // delete a single booking by matching id  
        */

        app.get('/booking',verifyJWT ,async(req,res)=>{
            const patient = req.query.patient;
            const decodedEmail = req.decoded.email;
            if(patient===decodedEmail){
                const query = {patient: patient};
            const bookings = await bookingCollection.find(query).toArray();
            return res.send(bookings);
            }
            else{
                return res.status (403).send({message:'Forbidden access'});
            }
        });


        app.get('/admin/:email',verifyJWT,async(req,res)=>{
            const email = req.params.email;
            const query = {email:email};
            const user = await userCollection.findOne(query);
            const isAdmin = user.role ==='admin';
            res.send({admin : isAdmin})
        })


        app.get('/user',verifyJWT, async(req,res)=>{
            const users = await userCollection.find().toArray();
            res.send(users);
        })
        
        app.put('/user/admin/:email',verifyJWT, async (req, res) => {
            const email = req.params.email;
            const requester = req.decoded.email; //which user is fetching the api
            const requsterAccount = await userCollection.findOne({email:requester}); // finding the requester from all the users
            if(requsterAccount.role==='admin') // checking if requester is an admin,if yes than. the other works will done
            {
                const filter = { email: email };
            const updateDoc = {
              $set: {role:'admin'},
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send({ result});
            }else{
                return res.status (403).send({message:'Forbidden access'})   //otherwise we are not giving the access to all fetching all users and return a error status
            }
            
          })
          
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
              $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({email:email},process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ result,token});
          })

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
        //warning : 
        //this is not the proper way to query 
        // after learning more about mongodb use aggregate lookup,pipeline,match,group,
        app.get('/available',async(req,res)=>{
            const date = req.query.date ;

            //step 1: get all services
            const services = await servicesCollection.find().toArray();

            //step 2: get the booking of the day

            const query = {date:date};
            const bookings = await bookingCollection.find(query).toArray();

            // step 3 : for each service,find bookings for that service. output[{},{},{},{}]

            services.forEach(service=>{
                const serviceBookings = bookings.filter(booking=>booking.treatment===service.name);
                //select slots for the service . output [{},{},{},{}]
                const bookedSlots = serviceBookings.map(serviceBooking=>serviceBooking.slot);
                // service.booked = bookedSlots;
                //select those slots that are not in bookedSlots
                const available  = service.slots.filter(slot=>!bookedSlots.includes(slot));
                //set avaible to slots to make it easier 
                service.slots = available;
                
            })
            res.send(services);
        })

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