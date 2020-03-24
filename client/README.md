# Type-in-Cloud-Client

Client
-	Landing page is a login page. Ask user to login or register.
-	Utilize AWS Cognito for login authentication. First name, last name, phone number and email. AWS provides a feature to allow user will get an authentication link in their email. 
-	Once logged in, user will be taken to the next page that has three buttons.
o	Play game – play the typing game The client will call http://api.quotable.io/random to get an random quote they can type to for 60 seconds. After they finish, the score will but packaged with username and sent to the server
o	Leaderboard – Show the top 10 highest score players. Fetch our server to bring back the data and display it to screen. 
o	Logout – go back to landing page 
-	Client will be hosted on amazon s3 static web hosting. 

