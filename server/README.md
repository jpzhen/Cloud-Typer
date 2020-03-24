# Type-in-Cloud-Server

Server
-	Store user’s information in azure table when they register. Using first name and last name as unique identifiers. Update their highest score every time they complete a round. 
-	Alert system by using AWS Simple Notification System. Whenever a user achieved a score that is in the top 10, send all players that are below that new score a message (email or phone number). 
-	Server will be stored in AWS s3 and using AWS Lambda to run whenever client requests it. Or hosting it on an AWS/Azure VM. 
