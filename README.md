

Node.js - [Download & Install Node.js](https://nodejs.org/en/download/)
npm - [Download & Install npm](https://www.npmjs.com/get-npm)


Here are the step-by-step instructions:

npm install

Create an Uploads Folder:
Create a folder named uploads in the root directory of your project. This folder will be used to store uploaded images. Make sure it's initially empty.

Register a User:
Navigate to the registration page (/register1) and register a user by providing the necessary information such as username, email, and password.

Login:
After registering, navigate to the login page (/login1) and log in with the credentials you just created.

Dashboard:
Upon successful login, you will be redirected to the dashboard. Initially, the dashboard will be empty, showing placeholders for "Artifact" and "Document".

Upload Image: foldername{uploads}
Navigate to the upload page (/upload1). If you haven't created the uploads folder, you'll encounter an error. Ensure the uploads folder exists in the project directory. Upload an image using the provided form.

View Artifact in Dashboard:
After uploading the image, return to the dashboard. You should now see the uploaded image displayed with an "Artifact" label at the top.

View Document in Navbar:
Navigate to the documents page (/documents1) using the navigation bar. Here, you'll see details about the uploaded document, including:

Title: The title of the document.
Content: The content of the document.
Filename: The filename, which should be the same as the artifact in MongoDB.
Artifact ID: The ID of the artifact, which should match the ID in MongoDB.
Verification in Dashboard:
Return to the dashboard, and you should now see the uploaded image displayed alongside the "Artifact" label.

Ensure that you follow these steps sequentially and make sure to handle errors or edge cases appropriately, such as ensuring the uploads folder exists before attempting to upload files.







to start 
node server.js

Login: http://localhost:3001/login1 - This URL likely corresponds to the login page of your application.

Register: http://localhost:3001/register1 - This URL likely corresponds to the registration page of your application.

Upload: http://localhost:3001/upload1 - This URL likely corresponds to a page or endpoint where users can upload documents.

Documents: http://localhost:3001/documents1 - This URL for   upload or link the aritfact with  document 
 add this 
 to Create Document
{Title: Content:
Filename: same as the artifact in mongodb 
Artifact ID: same as the arifact id in mongodb
}
Back to Artifacts
View the owner document : -
http://localhost:3001/mydocuments1