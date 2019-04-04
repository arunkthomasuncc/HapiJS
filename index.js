//npm install hapi
//create our instance
//choose the port
//define route
//start our project

//to validate our request
//without IF
//npm install joi

const Joi = require('joi')
// -> the configuration will be in route.config.validate
const Hapi = require('hapi')
const app  = new Hapi.Server({
    port : 3000
})
const mongoDBString = "mongodb://nodeschool:nodeschool123@cluster0-shard-00-00-rwlhl.mongodb.net:27017,cluster0-shard-00-01-rwlhl.mongodb.net:27017,cluster0-shard-00-02-rwlhl.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true"
// npm i mongodb
const {
    MongoClient,
    ObjectID
} =  require('mongodb')

async function connectAndGetCollection() {
    const connect = await MongoClient.connect(
        mongoDBString,
        { useNewUrlParser : true}
    )
    const collection = await connect.db('arunnodeschool').collection('heroes')
    return collection
}
async function main() {
    //simulating db
    //const db = []
    const db = await connectAndGetCollection()

    app.route([
        {
            //path to our customer
            path: '/heroes',
            //HTTP Method
            method: 'GET',
            config : {
                validate:{
                    //we could validate queryString params payload headers
                    query:{
                       // name : Joi.string().max(100).min(3).required(),
                       // age  : Joi.number().integer().required()
                          skip : Joi.number().integer().default(0),
                          limit : Joi.number().integer().default(10).max(10)
                    },
                    failAction(req,headers,error){
                        //if some validation is wrong, we expose to the client which error is
                        throw error
                    }
                }
            },
            async handler(req) {
               // return 'Hello World'
               // to get URL query
               // localhost:3000/heroes?myVariable=2
               const {
                   skip,
                   limit
               } = req.query
               // simulating our pagination
               // return db.slice(skip, limit)
               return db.find().limit(limit).skip(skip).toArray()
               
            }
        },
        {
            path : '/heroes',
            method : 'POST',
            config : {
                validate : {

                    query:{
                        name : Joi.string().max(100).required(),
                        age :  Joi.number().integer().required()
                    },
                    failAction(req,headers,error)
                    {
                        throw error
                    }
                }
            },
            async handler(req) {
                //receiving data
                const data = req.payload
                //db.push(data)
                await db.insertOne(data)
                return true;
            }

        },
        {
            path : "/heroes/{id}",
            method : 'DELETE',
            config: {
                validate: {
                    params:{
                        id: Joi.string().required()
                    }
                }
            },
            async handler(req){
                try{
                const {id} = req.params
                
                const result =  db.deleteOne({
                    // the ID field is a common string using ObjectID function, we will convert to a mongoDB ID
                    _id:ObjectID(id)
                })
                //using !!-> we convert empty string, null, undefined, 0 to false
                // -1,1,aaa, [0] => true
                return !!result.result.n
        
            }catch(error){
                console.log('Error',error)
                throw error
            }

            }
        },
        {
            path : '/heroes/{id}',
            method : 'PATCH',
            config : {
                validate :{
                    params: {
                        id : Joi.string().required()
                    },
                    payload : {
                        name : Joi.string().max(100),
                        age: Joi.number().integer().max(99)
                    }
                }
            },
            async handler(req){

                const id =req.params.id
                const payload= req.payload
                const res = await db.updateOne({
                    _id:ObjectID(id)
                },{
                    //using the $set, we wil update only the fields of request
                    $set:payload
                })

                console.log("resss",res)
                return res
            }

            

        }

    ])
    await app.start()
    console.log('server running at',app.info.port)
}
main()