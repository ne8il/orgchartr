Tasks = new Mongo.Collection("tasks");
People = new Mongo.Collection("people");

if (Meteor.isClient) {
  // This code only runs on the client
  Meteor.subscribe("people");

  Template.registerHelper('equals', function (a, b) {
      return a === b;
  });

  Template.registerHelper('ne', function (a, b) {
      return a !== b;
  });

  function allPeople(){
    return People.find({});
  }
  Template.addPersonForm.helpers({
    people : allPeople
  });

  function isAdding(){
    return Session.get("addingPerson");
  }

  function isEditing(){
    return Session.get("editingPerson") != null;
  }

  Template.body.helpers({

    showEditForm : function(){
      var showEdit = isAdding() || isEditing();
      return showEdit;
    },
    isAddingPerson : isAdding,
    isEditingPerson : isEditing,
    getEditPerson : function(){
      return People.findOne(Session.get("editingPerson"));
    },
    people : allPeople
  });

  Template.body.events({

  "click .add-person" : function(event){
    Session.set("addingPerson", true);
  },

  "click .edit-person button.cancel" : function(event){

    Session.set({
    "addingPerson" : false,
    "editingPerson" : null
    });

    return false;
  },

  "click .add-team" : function(event){

  },

  "click .edit-person button.delete" : function(event){
    Meteor.call("removePerson", Session.get("editingPerson"));

    Session.set({
      "addingPerson" : false,
      "editingPerson" : null
    });

    return false;
  },

  "click .edit-person button.save" : function(event){
    var nameInput = document.querySelector("#personName");
    var titleInput = document.querySelector("#personTitle");
    var bossInput = document.querySelector("#personBoss");

    var name = nameInput.value;
    var title = titleInput.value;
    var bossId = bossInput.value;

    if(Session.get("editingPerson")){
      Meteor.call("updatePerson", Session.get("editingPerson"), name, title, bossId);
    }else{
      Meteor.call("addPerson", name, title, bossId);
    }

    nameInput.value = "";
    titleInput.value = "";
    bossInput.value = "---";

    Session.set({
      "addingPerson" : false,
      "editingPerson" : null
    });

    return false;
    }
  });

  Template.diagram.rendered = function () {
    var svg = d3.select("#svgdiv").select("svg")
    	.attr("width", width + margin.right + margin.left)
    	.attr("height", height + margin.top + margin.bottom)
      .append("g")
    	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    this.autorun(function() {
      var people = People.find().fetch();
      if(people.length > 0){
        var tree = generateTree(people);
        root = tree[0];
        updateTree(svg, root);
      }
    });
  };

function findInList(list, id){
  return list.filter(function(person){
    return person._id === id;
  })[0];
}

function generateTree(list){
  var roots = [];

  list.forEach(function(node){
    node.children = [];
  });

  list.forEach(function(node){
    if (node.boss_id) {
        findInList(list, node.boss_id).children.push(node);
    } else {
        roots.push(node);
    }
  });

  return roots;
}

  var margin = {top: 100, right: 120, bottom: 20, left: 120},
  	width = 960 - margin.right - margin.left,
  	height = 800 - margin.top - margin.bottom;

  var i = 0;

  var tree = d3.layout.tree()
	.size([height, width]);

  var diagonal = d3.svg.diagonal()
	.projection(function(d) { return [d.x, d.y]; });

  function updateTree(svg, source) {

    var nodes = tree.nodes(root).reverse(),
  	  links = tree.links(nodes);

    nodes.forEach(function(d) { d.y = d.depth * 200; });

    var node = svg.selectAll("g.person-avatar")
  	  .data(nodes, function(d) { return d._id });

      node.exit().remove();

      var g = node.enter()
      .append("g")
      .attr("class", "person-avatar");

      g.append("rect");

      g.append("text")
      .attr("class", "icon");

      g.append("text")
      .attr("class", "name");

      g.append("text")
      .attr("class", "title");

      var rectWidth = 100,
          rectHeight = 150;

          node
          .transition()
          .duration(200)
      	  .attr("transform", function(d) {
      		  return "translate(" + d.x + "," + d.y + ")";
          });

          node.select("rect")
          .attr("width", rectWidth + "px")
          .attr("height", rectHeight + "px")
      	  .attr("x", -(rectWidth / 2) + "px")
          .attr("y", -(rectHeight / 2) + "px")
          .attr("rx", 15)
          .attr("ry", 15);

          node.select("text.icon")
          .text('\uf007')
          .attr("x","-25px")
          .attr("y","-20px")
          .classed("fa", true);

          node.select("text.name")
      	  .attr("dy", ".35em")
          .attr("text-anchor", "middle")
      	  .text(function(d) { return d.name; })

          node.select("text.title")
          .attr("y", 15)
          .attr("dy", ".5em")
          .attr("text-anchor", "middle")
          .text(function(d) { return "(" + d.title + ")" });

          node.on("click", function(d,i,j){
            var this_id = d._id;
            Session.set("editingPerson", this_id);
          });

    var link = svg.selectAll("path.link")
  	  .data(links, function(d) { return d.target._id; });

      link.exit().remove();

    link.enter().insert("path", "g")
  	  .attr("class", "link");

      link
      .transition()
      .duration(200)
  	  .attr("d", diagonal);
    }
}

if (Meteor.isServer) {
  Meteor.publish("people", function () {
    return People.find();
  });
}

Meteor.methods({

  addPerson : function(name, title, bossId){
    People.insert({
      name: name,
      title : title,
      createdAt: new Date(),
      boss_id : bossId === '---' ? null : bossId
      //owner: Meteor.userId(),
      //username: Meteor.user().username
    });
  },

  updatePerson : function(id, name, title, bossId){
    People.update(id, {
      $set : {
        name : name,
        title : title,
        boss_id : bossId === '---' ? null : bossId
      }
    });
  },

  removePerson : function(id){
    People.remove(id);
  }
});
