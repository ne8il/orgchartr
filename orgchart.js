Tasks = new Mongo.Collection("tasks");
People = new Mongo.Collection("people");

if (Meteor.isClient) {
  // This code only runs on the client
  Meteor.subscribe("people");

  Template.body.helpers({

    isAddingPerson : function(){
      return Session.get("addingPerson");
    },
    people : function(){
      return People.find({});
    },
    tasks: function () {
      if (Session.get("hideCompleted")) {
        // If hide completed is checked, filter tasks
        return Tasks.find({checked: {$ne: true}}, {sort: {createdAt: -1}});
      } else {
        // Otherwise, return all of the tasks
        return Tasks.find({}, {sort: {createdAt: -1}});
      }
    },
    hideCompleted: function () {
      return Session.get("hideCompleted");
    },
    incompleteCount: function () {
      return Tasks.find({checked: {$ne: true}}).count();
    }
  });

  Template.body.events({

  "click .add-person" : function(event){
    Session.set("addingPerson", true);
  },

  "click .new-person button.cancel" : function(event){
    Session.set("addingPerson", false);
  },

  "click .add-team" : function(event){

  },

  "submit .new-person" : function(event){
    var name = event.target.text.value;
    Meteor.call("addPerson", text);
    event.target.text.value = "";
    return false;
  },

  "submit .new-task": function (event) {
      // This function is called when the new task form is submitted

      var text = event.target.text.value;

      Meteor.call("addTask", text);

      // Clear form
      event.target.text.value = "";

      // Prevent default form submit
      return false;
    },

    "change .hide-completed input": function (event) {
      Session.set("hideCompleted", event.target.checked);
    }
  });

  Template.task.events({
    "click .toggle-checked": function () {
      // Set the checked property to the opposite of its current value
      Meteor.call("setChecked", this._id, ! this.checked);


    },
    "click .delete": function () {
      Meteor.call("deleteTask", this._id);
    }
  });
}

//
// if (Meteor.isClient) {
//   // counter starts at 0
//   Session.setDefault('counter', 0);
//
//   Template.hello.helpers({
//     counter: function () {
//       return Session.get('counter');
//     }
//   });
//
//   Template.hello.events({
//     'click button': function () {
//       // increment the counter when button is clicked
//       Session.set('counter', Session.get('counter') + 1);
//     }
//   });
// }

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });

  Meteor.publish("people", function () {
    return People.find();
  });
}

Meteor.methods({

  addPerson : function(text){
    People.insert({
      name: text,
      createdAt: new Date()
      //owner: Meteor.userId(),
      //username: Meteor.user().username
    });
  },


  addTask: function (text) {
    // Make sure the user is logged in before inserting a task
    //if (! Meteor.userId()) {
    //  throw new Meteor.Error("not-authorized");
    //}

    Tasks.insert({
      text: text,
      createdAt: new Date()
      //owner: Meteor.userId(),
      //username: Meteor.user().username
    });
  },
  deleteTask: function (taskId) {
    Tasks.remove(taskId);
  },
  setChecked: function (taskId, setChecked) {
    Tasks.update(taskId, { $set: { checked: setChecked} });
  }
});
