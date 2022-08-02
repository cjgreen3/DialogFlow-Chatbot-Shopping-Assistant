const express = require("express");
const { WebhookClient } = require("dialogflow-fulfillment");
const app = express();
const fetch = require("node-fetch");
const base64 = require("base-64");

let username = "";
let password = "";
let token = "";
let tags = [
"women",
"grey",
"sweats",
"pants",
"logo",
"men",
"shorts",
"black",
"polyester",
"white",
"visor",
"red",
"embroidered",
"pillow",
"badger",
"keychain",
"longsleeve"
];

USE_LOCAL_ENDPOINT = false;
// set this flag to true if you want to use a local endpoint
// set this flag to false if you want to use the online endpoint
ENDPOINT_URL = "";
if (USE_LOCAL_ENDPOINT) {
  ENDPOINT_URL = "http://127.0.0.1:5000";
} else {
  ENDPOINT_URL = "http://cs571.cs.wisc.edu:5000";
}


async function deleteMessages() {
  await fetch('http://cs571.cs.wisc.edu:5000/application/messages	', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token,
    }
  });
}

async function getToken() {
  let request = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + base64.encode(username + ":" + password),
    },
  };

  const serverReturn = await fetch(ENDPOINT_URL + "/login", request);
  const serverResponse = await serverReturn.json();
  token = serverResponse.token;

  return token;
}


app.get("/", (req, res) => res.send("online"));
app.post("/", express.json(), (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });

  function welcome() {
    agent.add("Webhook works!");
    let message = "Welcome to the sign in page of WiscShop!";
    agent.add(message);
    console.log(ENDPOINT_URL);

  }
  //Login
  async function login() {
    // You need to set this from `username` entity that you declare in DialogFlow
    username = agent.parameters.username;
    // You need to set this from password entity that you declare in DialogFlow
    password = agent.parameters.password;
    token = await getToken();
    await deleteMessages();
    await loadUserMessage("Attempting to login with username: " + agent.parameters.username + " password: " +  agent.parameters.password);
    agent.add("Attempting to loging with username: " + agent.parameters.username + " password: " + agent.parameters.password);

    //agent.add(token);
    let message = "Welcome to WiscShop, "+ username;

    if(token){
      agent.add(message);
      await loadAgentMessage(message);

    }
    else{
      agent.add("You've entered the Wrong username or password")
    }
    
  }
  //Queries
  async function queryCategory() {
    await loadUserMessage(agent.query);
    await fetch('http://cs571.cs.wisc.edu:5000/categories', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
       .then((response) => response.json())
       .then((responseData) => {
         formatCategories(responseData);
       }).catch((error) => {
         console.log(error)
       });
  }
  async function formatCategories(responseData) {
    let categories = responseData["categories"];
    let output = "Wiscshop categories are ";
    for (let i = 0; i < categories.length - 1; i++) {
      output += categories[i] + ", ";
    }
    output += "and " + categories[categories.length - 1];
    output += " product categories available on this website";
    agent.add(output);
    await loadAgentMessage(output);

  }
  async function queryCategoryTags() {
    await loadUserMessage(agent.query);
    let category = agent.parameters.categories;
    await loadUserMessage(category);
    let url = "http://cs571.cs.wisc.edu:5000/categories" + "/" + category + "/tags";
    await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
       .then((response) => response.json())
       .then((responseData) => {
         formatCategoriesTags(responseData, category);
       }).catch((error) => {
         console.log(error)
       });
  }

  async function formatCategoriesTags(responseData, category) {
    let categories = responseData["tags"];
    let output = "The available category tags for " + category + " are ";
    for (let i = 0; i < categories.length - 1; i++) {
      output += categories[i] + ", ";
    }
    output += "and " + categories[categories.length - 1];
    agent.add(output);
    await loadAgentMessage(output);

  }
  async function queryCart () {
    let keyword = agent.parameters.keywords;

    await loadUserMessage(agent.query);
    await fetch('http://cs571.cs.wisc.edu:5000/application/products/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token,
      },
    })
       .then((response) => response.json())
       .then((responseData) => {
         formatCartItems(responseData, keyword);
       }).catch((error) => {
         console.log(error)
       });
  }
  async function formatCartItems(responseData, keyword) {
    console.log(responseData);
    let products = responseData["products"];
    let output = "";
    if(keyword === "type"){
      for(let i = 0; i < products.length - 1; i++) {
        output += products[i].category + ", "
      }
      output += products[products.length - 1].category + " are the types of items in your cart!";
    }
    else if(keyword === "number"){
      let x = 0;
      for(let i = 0; i < products.length; i++) {
        x += products[i].count;
      }
      output += x +"  items in the cart right now."
    }
    else if(keyword === "total cost"){
      let x = 0;
      for(let i = 0; i < products.length; i++) {
        x += products[i].price;
      }
      output += "$" + x;
    }
    agent.add(output);
    await loadAgentMessage(output);
  }

  async function loadAgentMessage(message) {
    await fetch('http://cs571.cs.wisc.edu:5000/application/messages/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token,
      },
      body: JSON.stringify({
        "isUser":false,
        "text": message
      }),
    });
  }
  
  async function loadUserMessage(message) {
    await fetch('http://cs571.cs.wisc.edu:5000/application/messages/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token,
      },
      body: JSON.stringify({
        "isUser":true,
        "text": message
      }),
    });
  }

  async function navigation() {
     let page = agent.parameters.pages;
     console.log(page);
     if (page == "home") {
       page = "";
     }
     else if(page == "back") {
       page = "";
     }
     console.log(page);
      await fetch('http://cs571.cs.wisc.edu:5000/application', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token,
        },
        body: JSON.stringify({"page": "/" + username + "/" + page}),
      })
      .then((response) => response.json())
         .then((responseData) => {
           console.log(responseData);
         }).catch((error) => {
           console.log(error)
         });
      await loadUserMessage(agent.query);
      
      if(page == "") {
        page = "home";
      }
      let output = "You are now in the " + page + " page!";
      await loadAgentMessage(output);
      agent.add(output);
  }

  async function addFilterTags() {
    await loadUserMessage(agent.query);
    
    let tag = agent.parameters.tags;
    let valid = false;
    console.log(tag);
    for (let i = 0; i < tags.length; i++) {
      if(tags[i] === tag) {
        valid = true;
        break;
      }
    }
    console.log(valid);

    if(valid) {
      await fetch("http://cs571.cs.wisc.edu:5000/application/tags/" + tag, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token,
        },
        // body: JSON.stringify({
        //   //"tags":tag
        // }),
      });
      let message = "Tag " + tag + " added!";
      agent.add(message);
      await loadAgentMessage(message);
    } 
    else {
      let message2 = "Not a valid tag. Please try again.";
      agent.add(message2);
      await loadAgentMessage(message2);
    }
  }

  async function getId(){
    return await fetch("http://cs571.cs.wisc.edu:5000/application",{
          headers: {
            'Content-Type': 'application/json',
            'x-access-token': token,
          },
        }).then((response) => response.json())
           .then((responseData) => {
            console.log(responseData);
            let page = responseData["page"];
            console.log(page);
            let position = page.search("products");
            console.log(position);

            if(position !== -1) {
              return page.substring(position+9, page.length);
            }
            return -1;
      });
}

  async function queryProductInfo() {
    await loadUserMessage(agent.query);
    let productId = await getId();
    console.log(productId);
    if(productId !== -1) {
        await fetch("http://cs571.cs.wisc.edu:5000/products/" + productId +"/reviews", {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
           .then((response) => response.json())
           .then((responseData) => {
             formatDetails(responseData);
           }).catch((error) => {
             console.log(error)
           });
    } 
    else {
      let message = "Please navigate to a product page to request reviews and ratings of a product!";
      agent.add(message);

      await loadAgentMessage(message);
    }
  }

  async function formatDetails (responseData) {
    let reviews = responseData["reviews"];
    let review= "Reviews:\n";

    let ratingsSum = 0;

    for(let i = 0; i < reviews.length; i++) {
      
      review += reviews[i].title + "\n";
      review += reviews[i].text + "\n";
      ratingsSum += reviews[i].stars;
    }
    ratingsSum /= reviews.length;

    review += "\n"+ "Average rating: " + ratingsSum;

    agent.add(review);
    await loadAgentMessage(review);
  }



  async function addItemToCart () {
    await loadUserMessage(agent.query);
    let quantity = agent.parameters.quantity;
    let productId = await getId();

    // if(agent.parameters.quantity === undefined) {
    //   quantity = 1;
    // }
    
    if(productId !== -1){
    getId();
      for(let i = 0; i < quantity; i++) {
        await fetch("http://cs571.cs.wisc.edu:5000/application/products/" + productId, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-access-token': token,
          },
        });
      }
      let message = quantity + " items added to the cart!";
      agent.add(message);
      await loadAgentMessage(message);
    } 
    else {
      let message = "Please navigate to a product page to add a product to the cart!";
      agent.add(message);
      await loadAgentMessage(message);
    }
}


async function removeItemFromCart () {
  await loadUserMessage(agent.query);
  let productId = await getId();
  let quantity = agent.parameters.quantity;


  if(productId !== -1) {
    for(let i = 0; i < quantity; i++) {
      await fetch("http://cs571.cs.wisc.edu:5000/application/products/" + productId, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token,
        },
      });
    }
    let message = quantity + " removed from cart";
    agent.add(message);
    await loadAgentMessage(message);
  } 
  else {
    let message = "Please go to a product page to add the product to the cart!";
    agent.add(message);
    await loadAgentMessage(message);
  }
}

async function confirmCart() {
  let request = agent.parameters.request;
  console.log(request);
  let url = "";
  if (request == "confirm") {
    url = "cart-confirmed";
  }
  else if(request == "review") {
    url = "cart-review";

  }
   await fetch('http://cs571.cs.wisc.edu:5000/application', {
     method: 'PUT',
     headers: {
       'Content-Type': 'application/json',
       'x-access-token': token,
     },
     body: JSON.stringify({"page": "/" + username + "/" + url}),
   })
   .then((response) => response.json())
      .then((responseData) => {
        console.log(responseData);
      }).catch((error) => {
        console.log(error)
      });
   await loadUserMessage(agent.query);
   let output = "You are now in the " + url + " page!";
   await loadAgentMessage(output);
   agent.add(output);
}




 


  let intentMap = new Map();
  intentMap.set("Default Welcome Intent", welcome);
  // You will need to declare this `Login` intent in DialogFlow to make this work
  intentMap.set("Login", login);
  intentMap.set('queryCategory', queryCategory);
  intentMap.set('queryCategoryTags', queryCategoryTags);
  intentMap.set('queryCart', queryCart);
  intentMap.set('queryProductInfo', queryProductInfo);
  //ask about
  intentMap.set('addFilterTags', addFilterTags);
  intentMap.set('addItemToCart', addItemToCart);
  intentMap.set('removeItemFromCart', removeItemFromCart);
  intentMap.set('confirmCart', confirmCart);
  intentMap.set('navigation', navigation);

  agent.handleRequest(intentMap);
});

app.listen(process.env.PORT || 8080);
