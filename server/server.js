const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const AWS = require('aws-sdk');
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
global.fetch = require('node-fetch');

var port = normalizePort(process.env.PORT || '8081');
app.listen(port, () => {
    console.log('listening on '+ port);
});

AWS.config.update({region: 'us-west-2'});
AWS.config.getCredentials((err) => {
    if (err) console.log(err.stack);
    else console.log('region: ' + AWS.config.region);
})

const poolData = {
    UserPoolId: "us-west-2_hqGTZ1Jjv",
    ClientId: "6rq8h9qra7muscmoka8rv1gosj"
}
const sns = new AWS.SNS();
const myDynamodb = new AWS.DynamoDB.DocumentClient();
const cloudtypePool = new AmazonCognitoIdentity.CognitoUserPool(poolData);


//////////////////////


app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors());


// Endpoints
app.get('/', (req, res) => {
    res.sendFile(__dirname +'/index.html')
});

app.post('/login', (req, res) => {
    console.log(req.body);
    var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
        Username: req.body.Username,
        Password: req.body.Password
    });
    
    let userData = {
        Username: req.body.Username,
        Pool: cloudtypePool
    }
    let cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
            let tuser = result.getIdToken().payload.email;
            res.send({name:tuser, status:200});
        },
        onFailure: (err) => {
            res.send({name:"", status:404});
        },
    });
});

// Query azure table and send back the top players
app.get('/leaderboard/top10', (req, res) => {
    getTop10players()
    .then(result=> {
        res.send(result);
    });
});

app.get('/profile/', (req, res) => {
    getUser(req.query.email)
    .then(result => {
        res.send(result);
    });
});

// Query azure table and update a player's score
app.post('/update/player/score', (req, res) => {
    updatePlayerScore(req.body.email, req.body.score);
    res.send("Updated player's score");
});

// add a new player to cognito and dynamodb
app.post('/add/player', (req, res) => {
    var attributeList = [];
    attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name:"email",Value:req.body.email}));
    attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name:"given_name",Value:req.body.firstName}));
    attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name:"family_name",Value:req.body.lastName}));
    console.log(attributeList);
    cloudtypePool.signUp(req.body.email, req.body.password, attributeList, null, (err, ress) => {
        if(err) {
            console.log(err);
            res.send(err);
            return;
        }
        console.log("Success!!!!!");
        addNewSubscriber(req.body.email);
        if (addNewPlayer(req.body.email,req.body.firstName,req.body.lastName)) {
            res.send(200);
        };
    });
});

// Update a player's score in our dynamo db table
async function updatePlayerScore(playerEmail, newplayerScore) {
    var params = {
        TableName: 'PlayerRecords',
        Key: { email : playerEmail },
        ConditionExpression: '#score < :newScore',
        UpdateExpression: 'set #score = :newScore',
        ExpressionAttributeNames: {'#score' : 'score'},
        ExpressionAttributeValues: {
          ':newScore' : newplayerScore
        }
    }
    checkFirstPlace(playerEmail, newplayerScore);
    myDynamodb.update(params, (err, data) => {
        if (err) {
            console.log(err);
        }
        console.log(data);
    });
}

async function checkFirstPlace(playerEmail, newplayerScore){
    let params = {
        TableName: 'PlayerRecords',
        IndexName: "status-score-index",
        KeyConditionExpression: "#status = :gsi",
        ExpressionAttributeNames: {
            "#status" : "status"
        },
        ExpressionAttributeValues: {
            ":gsi": "gsi"
        },
        ScanIndexForward: false,
        Limit: 1
    };
    myDynamodb.query(params, (err, data) => {
        if(err) {
            console.log(err);
        }
        else {
            console.log("current leader: " + data.Items[0].score + " new challenger: " + newplayerScore);
            if (data.Items[0].score < newplayerScore) {
                console.log("BEATed");
                notifySubscribers(playerEmail, newplayerScore);
            }
        } 
    });
}



// Get a player's profile in our dynamo db table
async function getUser(playerEmail) {
    var params = {
        TableName : 'PlayerRecords',
        Key: { 
            email: playerEmail 
        }
    };
    let result = await myDynamodb.get(params, function(err, data) {
        if (err) {
            console.log(err);
        }
        return data;
    }).promise();
    return result;
}

// Add a player's profile in our dynamo db table
async function addNewPlayer(email, firstName,lastName) {
    var params = {
        TableName : 'PlayerRecords',
        Item: {
            email: email,
            score: 0,
            firstName: firstName,
            lastName: lastName,
            status: "gsi"
        },
    };
    let result = await myDynamodb.put(params, (err, data) => {
        if (err) {
            console.log(err);
            return false;
        }
        else return true;
    }).promise();
    return result;
}

// Query dynamo db and return a list of the top 10 highest scored players
async function getTop10players() {
    let params = {
        TableName: 'PlayerRecords',
        IndexName: "status-score-index",
        KeyConditionExpression: "#status = :gsi",
        ExpressionAttributeNames: {
            "#status" : "status"
        },
        ExpressionAttributeValues: {
            ":gsi": "gsi"
        },
        ScanIndexForward: false,
        Limit: 10
    };
    let results = await myDynamodb.query(params, (err, data) => {
        if(err) {
            console.log(err);
        } 
    }).promise();
    return results;
}

function normalizePort(val) {
    var port = parseInt(val, 10);
    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }
    return false;
}

async function addNewSubscriber(newSubEmail) {
    var newSubParams = {
        Protocol: 'EMAIL',
        TopicArn: 'arn:aws:sns:us-west-2:575943719965:Leaderboard',
        Endpoint: newSubEmail
    };
    var subPromise = sns.subscribe(newSubParams).promise();
    subPromise.then(
        function(data) {
          console.log("Subscription ARN is " + data.SubscriptionArn);
        }).catch(
          function(err) {
          console.error(err, err.stack);
        });
}

async function notifySubscribers(newLeaderName, newLeaderTime) {
    var notifParams = {
        Subject: 'NEW LEADER',
        Message: 'Look out! ' + newLeaderName + ' has set a new record time of ' + newLeaderTime + '! Get back to typing and beat their record!',
        TopicArn: 'arn:aws:sns:us-west-2:575943719965:Leaderboard',
    };
    sns.publish(notifParams, (err, data) => {
        if (!err) {
            console.log('Message ' + notifParams.Message + 'sent to ${params.TopicArn}');
            console.log("MessageID is " + data.MessageId);
        }
        else {
            console.error(err, err.stack);
        }
    });
}