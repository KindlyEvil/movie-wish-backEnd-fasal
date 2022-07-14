
const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./models/Users.model');
const jwt = require('jsonwebtoken');


app.use(cors());
app.use(express.json())

const mongoPass = 'MongoDb';
const DB = `mongodb+srv://Sahil:${mongoPass}@cluster0.nsage.mongodb.net/wish-movie-users?retryWrites=true&w=majority`;

mongoose.connect(DB);

const jwtSecretKey = 'secretkey123';

app.post('/api/register', async (req, res) => {
    console.log(req.body);

    try {
        await User.create({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,

        })
        res.json({ status: 'ok' });

    } catch (error) {
        res.json({ Status: 'error', error: 'Email Already Exist!!!' })

    }
})

app.post('/api/login', async (req, res) => {

    const user = await User.findOne({
        email: req.body.email,
        password: req.body.password,
    })
    if (user) {

        const token = jwt.sign(
            {
                name: user.name,
                email: user.email
            }, 
            jwtSecretKey)
            
        return res.json({ status: 'ok', user: token })
    } else {
        return res.json({ status: 'error', user: false })
    }
})

app.put('/api/addToWacthlist', async (req, res) => {
    const token = req.headers['x-access-token'];

    try {
        const decode = jwt.verify(token, jwtSecretKey);
        const email = decode.email;
        console.log(email);
        await User.updateOne(
            { email: email },
            { $push: { movies: req.body.imdbID } }
        )
        res.json({ status: 'ok' })
    } catch (error) {
        res.json({ status: 'error', error: error })
    }

})

app.get('/watchlist', async (req, res) => {
	const token = req.headers['x-access-token'];
	try {
		const decoded = jwt.verify(token, jwtSecretKey);
		const email = decoded.email;

		User.findOne({ email: email }).exec()
		.then(docs=>res.json({status:"success",data:docs.movies}))
		.catch(err=>res.json({ status: 'error', error: err }))
    } catch (error) {
		res.json({ status: 'error', error: 'invalid token' })
	}
});

app.put('/makepublic', async (req, res) => {
	const token = req.headers['x-access-token'];
	try {
		const decoded = jwt.verify(token, jwtSecretKey)
		const email = decoded.email
		await User.updateOne(
			{ email: email },
			{ public: true}
		)
		return res.json({status:"success",message:"made public"})
	} catch (error) {
		res.json({ status: 'error', error: 'invalid token' })
	}
});

app.put('/makeprivate', async (req, res) => {
	const token = req.headers['x-access-token'];
	try {
		const decoded = jwt.verify(token, jwtSecretKey)
		const email = decoded.email
		await User.updateOne(
			{ email: email },
			{ public: false}
		)
		return res.json({status:"success",message:"made private"})
	} catch (error) {
		res.json({ status: 'error', error: 'invalid token' })
	}
});

app.get('/watchlist/:email', async function(req, res) {
    // Retrieve the tag from our URL path
	try{
    var email = req.params.email;
	const token = req.headers['x-access-token'];
    let user = await User.findOne({email: email}).exec();
	if(user.public)
	{
		res.json(user.movies);
	}
	else
	{
		const decoded = jwt.verify(token, jwtSecretKey);
		const useremail = decoded.email;
		if(useremail===email)
		{
			res.json(user.movies);
		}
		else
		{
			res.send({message:"private watchlist please login with correct ID"})
		}
	}
}
catch{
	res.json({status:"error",message:"internal error"});
}
});


app.listen(process.env.PORT || 1337, () => {
    console.log('Server is running on port 1337');
});