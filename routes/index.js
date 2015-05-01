var express = require('express');
var router = express.Router();



var isAuthenticated = function (req, res, next) {
	// if user is authenticated in the session, call the next() to call the next request handler 
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects
	if (req.isAuthenticated())
		return next();
	// if the user is not authenticated then redirect him to the login page
	res.redirect('/');
}

module.exports = function(passport){

	/* GET login page. */
	router.get('/', function(req, res) {
    	// Display the Login page with any flash message, if any
		res.render('index', { message: req.flash('message') });
	});

	/* Handle Login POST */
	router.post('/login', passport.authenticate('login', {
		successRedirect: '/home',
		failureRedirect: '/',
		failureFlash : true  
	}));

	/* GET Registration Page */
	router.get('/signup', function(req, res){
		res.render('register',{message: req.flash('message')});
	});

	/* Handle Registration POST */
	router.post('/signup', passport.authenticate('signup', {
		successRedirect: '/home',
		failureRedirect: '/signup',
		failureFlash : true  
	}));

	/* GET Home Page */
	router.get('/home', isAuthenticated, function(req, res){
                res.render('home', {user: req.user});
	});

	/* GET Search Page */
	router.get('/search', isAuthenticated, function(req, res){
                res.render('search', {user: req.user});
	});
        /* POST search page */
        router.post('/search', isAuthenticated, function(req, res){
            var searchtext = req.body.searchtext;
            console.log('in /search post. for searchtext = ' + searchtext);
            console.log('type of search = ' + req.param('searchtype'));
            if( req.param('searchtype') == "Project Names") {
               console.log('Searching for project names');
	       //var projects = searchProjectNames( req);
               var Project = require( "../models/project");
	       Project.find( {}, function( err, obj) {
	   	   var projectNames = [];
		   var searchtext = req.body.searchtext;
		   for( var i = 0; i < obj.length; i++) {
		       console.log('looking for ' + searchtext + '  in ' + obj[i].name);
		       var pos = obj[i].name.toLowerCase().indexOf(searchtext.toLowerCase());         
		       if( pos == -1) {
       	                   continue;
		       } else {
		   	   console.log( "found in " + obj[i].name);
			   projectNames.push( obj[i].name);
		       }
		   }
		   console.log('returning from function . projectNames #' + projectNames.length);
                   res.render( 'searchresults', { 'projects': projectNames});
               });
               return;
            } else
            if( req.param('searchtype') == "Project Descriptions") {
               console.log('Searching for project Descriptions');
               var Project = require( "../models/project");
	       Project.find( {}, function( err, obj) {
	   	   var projectNames = [];
		   var searchtext = req.body.searchtext;
		   for( var i = 0; i < obj.length; i++) {
		       console.log('looking for ' + searchtext + '  in ' + obj[i].name);
		       var pos = obj[i].description.toLowerCase().indexOf(searchtext.toLowerCase());         
		       if( pos == -1) {
       	                   continue;
		       } else {
		   	   console.log( "found in " + obj[i].name);
			   projectNames.push( obj[i].name);
		       }
		   }
		   console.log('returning from function . projectNames #' + projectNames.length);
                   res.render( 'searchresults', { 'projects': projectNames});
               });
               return;
	   } else
            if( req.param('searchtype') == "Comments") {
               console.log('Searching for comments');
               var Project = require( "../models/project");
	       Project.find( {}, function( err, obj) {
	   	   var projectNames = [];
		   var searchtext = req.body.searchtext;
		   for( var i = 0; i < obj.length; i++) {
		       console.log('looking for ' + searchtext + '  in comments of ' + obj[i].name);
                       var comments = obj[i].comments; 
                       for ( var j = 0; j < comments.length; j++) {
		           var pos = comments[j].comment.toLowerCase().indexOf(searchtext.toLowerCase());         
		           if( pos == -1) {
       	                       continue;
		           } else {
		   	       console.log( "found in " + obj[i].name);
			       projectNames.push( obj[i].name);
                               break;
		           }
		        }
                   }
		   console.log('returning from function . projectNames #' + projectNames.length);
                   res.render( 'searchresults', { 'projects': projectNames});
               });
               return;
	   }

            else {
               console.log('projectnames is not true');
               res.render( 'searchresults', { projects: []});
            }
            
        });
	/* GET addproject Page */
	router.get('/addproject', isAuthenticated, function(req, res){
                if( req.user.role != "Root") {
 		    res.redirect( '/');
                }
		res.render('addproject');
	});

	/* Handle addproject POST */
	router.post('/addproject', isAuthenticated, function( req, res) {
                if( req.user.role != "Root") {
 		    res.redirect( '/');
                }

                console.log( 'Form ' + req.query.form);
	        console.log( 'project name: ' + req.body.name);
 	        // create newProject
         	var Project = require('../models/project');
                var newProject = new Project();
 		newProject.name = req.body.name;
 		newProject.description = req.body.description;
		newProject.manager = req.body.manager;
                newProject.budget = req.body.budget;
                newProject.admin = req.user.username;
                newProject.cost = 0;
                newProject.workers = [];

		var User = require('../models/user'); 
		User.findOne( {'username' : req.body.manager, 'role':'Manager' }, function(err, obj) { 
                    if( err || obj == null) {
                        console.log( '+++++++++++++++++++++++++++++++project not created cause there is not manager by that name');
                        res.redirect('/profile'); 
                        return;
                    }
		    newProject.save();
                    console.log( '+++++++++++++++++++++++++++++++created project:' + newProject);
                    res.redirect('/project/' + newProject.name); 
		});
	});



	router.get( '/project/:name', isAuthenticated, function(req,res) {
                console.log('---------------------------------- in /project/:name. name: ' + req.params.name);
		var Project = require('../models/project'); 
		var project = Project.findOne( {'name' : req.params.name }, 
                                               function(err, obj) {
                                                     console.log('in findOne. returning obj = ' + obj); 
                                                     res.render('project', {user: req.user, project: obj});
                                                     return obj;
                                               }
                                             );
	});
 
        // add user to project with :name , username is passed as req.body.newuser
	router.post('/adduser/:name', isAuthenticated, function(req, res) {
                if( req.user.role != "Manager") { // only manager can add users
                    res.redirect( '/project/' + req.params.name);
                    return;
                }
                var Project = require( '../models/project'); 
                var User = require( '../models/user'); 
                projectName = req.params.name;
                console.log( "In add user. adding user " + req.body.newuser + " to project " + req.params.name);
                var project = Project.findOne( { 'name': req.params.name},
		      function( err, obj) {
                          console.log(" obj = " + obj );
			  if( err || obj == null) { 
			      console.log('error in adduser. project not found: ' + req.params.name);
                              res.redirect( '/project/' + req.params.name); // dont add anything in this case
			      return;
                          }   
                          var user = User.findOne( { 'username': req.body.newuser},
                              function( err, obj1) {
			          if( err || obj1 == null) { 
 				      console.log( "error in adduser. user not found: " + req.body.newuser);
                                      res.redirect( '/project/' + req.params.name); // dont add anything in this case
                                      return;
                                  }
                                  var workers = obj.workers;
                                  var newworker = { workerName: req.body.newuser, hoursWorked: 0, projectRate: obj1.rate, costWorked: 0};
                                  // make sure that the worker is not already present 
                                  for( var i = 0; i < workers.length; i++) { 
                                      if( workers[i].workerName == req.body.newuser) { 
                                          res.redirect( '/project/' + req.params.name); // dont add anything in this case
                                          return;     
                                      }   
                                  }
                                  workers.push( newworker);
                                  console.log( "new workers: " + workers );
                                  Project.update( {'name': req.params.name}, { 'workers': workers} , function(err,obj1) {
                                      console.log('updated . response was ' + obj1);
                                      res.redirect( '/project/' + req.params.name);     
                                  });
        });
        });
        });
        // remove worker from project :name
	router.post('/removeworker/:name', isAuthenticated, function(req, res) {
                var Project = require( '../models/project'); 
                projectName = req.params.name;
                console.log( "In remove worker. removing worker " + req.body.newuser + " from project " + req.params.name);
                var project = Project.findOne( { 'name': req.params.name},
                              function( err, obj) {
                                  if( err || obj == null) { 
 				      console.log('error in removeworker ');
                                      res.redirect('/home');
                                  }   
                                  console.log(" obj = " + obj );
                                  var workers = obj.workers;
         		
                                  workerfound = false;
                                  var i; // lets find the worker that has to be removed
                                  for( var i = 0; i < workers.length; i++) {
                                       if( workers[i].username == req.body.workername) {
                                           workerfound = true;
                                           break;
                                       }
                                  }
                                  if ( workers.length == 0 ||  !workerfound){ // there was no worker of that name working on the project
                                      res.redirect( '/project/' + req.params.name);
                                      return;
                                  }
                                  workers[i] = workers[ workers.length -1];
                                  workers.pop();
                                  
 				  var totalcost = 0;
                                  var totalhours = 0;	
                                  for( var i = 0; i < workers.length; i++) {
                                      totalhours += workers[i].hoursWorked;
                                      totalcost +=  workers[i].costWorked;
                                  } 
                                  
                                  console.log( "new workers: " + workers );
                                  obj.workers = workers;
                                  obj.cost = totalcost;
                                  obj.totalHoursWorked = totalhours;
                                  //Project.update( {'name': req.params.name}, { 'workers': workers} , {'cost': totalcost} ,{ 'totalHoursWorked': totalhours },  function(err,obj1) {
                                  obj.save(  function(err,obj1) {
                                      console.log('updated . response was ' + obj1);
                                      res.redirect( '/project/' + req.params.name);     
                                  });
        });
        });

	router.get( '/user/:name', isAuthenticated, function(req,res) {
                console.log('---------------------------------- in /user/:name. name: ' + req.params.name);
                if( req.params.name == req.user.username) { // if a user clicks on his name, they are taken to their /profile
                    res.redirect( '/profile');
                    return;
                } else {
		var Project = require('../models/project'); 
		var User = require('../models/user'); 
                
                var viewersProjects = []; // these are the projects that are common between the logged in user, and the profile they want to look at
                User.findOne( {'username': req.params.name}, function( err, viewed) {
                    if( err || viewed == null) {
			// no user by that name
                        res.redirect('/profile');
			return;
                    }
                
                    console.log( "found the viewed user : " + viewed.username );
                    if( req.user.role == "Manager") {
		        var projectsManaged = Project.find( {'manager' : req.user.username},  function(err, projectsManaged) {
                            if( err) {
                               console.log("error in finding managed projects");
 			    } else { 
                                console.log( " found managed projects  #: " + projectsManaged.length);
                                viewersProjects = projectsManaged;
                            }
                        res.render( 'userprofile', { 'viewed': viewed, 'viewer': req.user, 'viewersProjects': viewersProjects  });
                        return;
                        });
                    }
                    if( req.user.role == "Root") {
		        var projectsOwned = Project.find( {'admin' : req.user.username},  function(err, projectsOwned) {
                            if( err) {
                               console.log("error in finding owned projects");
 			    } else { 
                                console.log( " found owned projects  #: " + projectsOwned.length);
                                viewersProjects = projectsOwned;
                            }
                        res.render( 'userprofile', { 'viewed': viewed, 'viewer': req.user, 'viewersProjects': viewersProjects  });
                        return;
                        });
                    }
                    if( req.user.role == "Worker") {
                        console.log( "current user is a " + req.user.role);
		        var projectsWorkingOn = Project.find( {'workers.workerName' : req.user.username},  function(err, projectsWorkingOn) {
                            if( err) {
                               console.log("error in finding projects working on");
 			    } else { 
                                console.log( " found owned projects  #: " + projectsWorkingOn.length);
                                viewersProjects = projectsWorkingOn;
                            }
                        res.render( 'userprofile', { 'viewed': viewed, 'viewer': req.user, 'viewersProjects': viewersProjects  });
                        return;
                        });
                    }
                
                });
                } // else
        });

/*              if( req.user.role == "Root") {
                }

                if( req.user.role == "Worker") {
                }
		var project = Project.find( {'admin' : req.user.username, 'assignedTo': req.params.name }, 
                                               function(err, obj) {
                                                     console.log('in findOne. returning obj = ' + obj); 
                                                     res.render('user', {user: req.user, assignedToUser: req.params.name, projects: obj});
                                                     return obj;
                                               }
                                             );
	}}*/
      
	
	router.get( '/profile', isAuthenticated, function(req,res) {
		var Project = require('../models/project'); 
                var projectsWorking = Project.find( {'workers.workerName': req.user.username}, function( err, obj1) {
                                                     projectsWorking = obj1;
                                                     console.log( "user " + req.user.username + " is working on following # " + projectsWorking.length);
                                console.log('projectsWorking in /profile # ' + obj1.length); 
                var projectsManaged = Project.find( {'manager': req.user.username}, function( err, obj2) {
                                                     projectsManaged = obj2;
		var project = Project.find( {'admin' : req.user.username }, 
                                               function(err, obj) {
                                                     console.log("-------------------------------------in /profile for username = "  + req.user.username);
                                                     project = obj; 
                                                     if( req.user.role == "Manager") {
                                                       res.render('managerprofile', {user: req.user, projectx: project, projectsManagedx: projectsManaged});
                                                     } else {
                                                       if( req.user.role == "Worker") {
                                                         res.render('workerprofile', {user: req.user, projectx: project, projectsWorkingx: projectsWorking});
                                                       } else if( req.user.role == "Root") {
                                                         res.render('rootprofile', {user: req.user, projectx: project, projectsManagedx: projectsManaged});
                                                       } else {
                                                         res.render('profile', {user: req.user, projectx: project, projectsManagedx: projectsManaged});
 						       }                                                   
                                                     }
                                                      return obj;
                                                  });
                                                });
                                              });
	});
        // deletes a project. done by root.
        router.post('/delete/:name', isAuthenticated, function(req, res) { 
		var Project = require('../models/project'); 
                Project.remove( {'name': req.params.name }, function( err, obj) {
                     

                var projectAssigned = Project.find( {'assignedTo': req.user.username}, function( err, obj1) {
                                                     projectAssigned = obj1;
		var project = Project.find( {'admin' : req.user.username }, 
                                               function(err, obj) {
                                                     console.log('in findOne. returning obj = ' + obj); 
                                                     project = obj; 
                                                     return obj;
                                                  });
                                               });
                    return;
                });
                res.redirect('/profile');
        });
        // add hours to the project worked by the current logged in user. applicable only for worker. name is project name
        router.post('/addhours/:name', isAuthenticated, function( req,res) {
                if( req.user.role != "Worker") {
                     res.redirect( "/project/" + req.params.name);
                     return;
                }
                // in case of worker
                var Project = require( '../models/project'); 
                var projects = Project.findOne( {"name": req.params.name,  "workers.workerName": req.user.username}, function( err, obj) {
                     console.log( " -------------------------------------------In /addhours/name  obj = " + obj ); 
                     var workers = obj.workers;
		     console.log( "obj.admin = " + obj.admin + " obj.workers = " + obj.workers);
                     var totalHoursWorked = 0;
                     var totalCostWorked = 0;
		     // update the specific workers hours worked, and recalculate total hours worked
                     var newCostWorked = 0;
                     var newHoursWorked = 0;
                     for( var i = 0; i < workers.length; i++) { 
                         if ( workers[i].workerName == req.user.username) {
                             console.log( "hours already worked by this user: " +  workers[i].hoursWorked + " further adding " + req.body.hoursworked);  
                             workers[i].hoursWorked += Number(req.body.hoursworked);
                             newCostWorked =  workers[i].projectRate * Number(req.body.hoursworked);
                             workers[i].costWorked  += newCostWorked ;
                         }
                         totalHoursWorked  += workers[i].hoursWorked;
                         totalCostWorked += workers[i].costWorked
                         console.log( "i = "  + i + "costWorked = " +  Number(workers[i].costWorked)   + "  hours worked = " +   Number(workers[i].hoursWorked));
                     }
                   
		     obj.totalHoursWorked = totalHoursWorked;
                     obj.cost =  totalCostWorked
                     obj.workers = workers;
                     obj.save( function( err, obj1) {
                         if( err) {
 			    console.log( "could not save hours worked. err = " + err);
                         } else { 
                            console.log("saved/updated hours worked. obj.totalHoursWorked = " + obj.totalHoursWorked);
                         }
                         res.redirect( "/project/" + req.params.name);
                         return;
                     }); 
                });
        });
        router.post('/addcomment/:name', isAuthenticated, function(req, res) {
          		      console.log('In /addcomment/:name route for name = ' + req.params.name);
           	              var Project = require( '../models/project');
		              console.log('adding comment ' + req.body.comment + ' to project ' + req.params.name);
                    
       			      var project = Project.findOne( { 'name': req.params.name},
                              function( err, obj) {
                                  if( err || obj == null) { 
 				      console.log('error in addcomment ');
                                      res.redirect('/home'); 
                                      return;
                                  }   
                                  console.log(" obj = " + obj );
                                  var comments = obj.comments;
                                  var currentdate = getDateTime();
                                  var newcomment = { date: currentdate  , username: req.user.username, comment: req.body.comment, };
                                  comments.push( newcomment);
                                  console.log( "new #comments: " + comments.length );
                                  Project.update( {'name': req.params.name}, { 'comments': comments} , function(err,obj1) {
                                      console.log('updated . response was ' + obj1);
                                      res.redirect( '/project/' + req.params.name);     
                                  });
            });
            });

	/* Handle Logout */
	router.get('/signout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

	return router;
}

function searchProjectNames( req) {
    console.log( "--------------------------In searchProjectNames");
    var Project = require( "../models/project");
    Project.find( {}, function( err, obj) {
        var projectNames = [];
        var searchtext = req.body.searchtext;
        for( var i = 0; i < obj.length; i++) {
            console.log('looking for ' + searchtext + '  in ' + obj[i].name);
            var pos = obj[i].name.toLowerCase().indexOf(searchtext.toLowerCase());         
            if( pos == -1) {
                continue;
            } else {
                console.log( "found in " + obj[i].name);
                projectNames.push( obj[i].name);
            }
        }
        console.log('returning from function in searchProjectNames. projectNames #' + projectNames.length);
        return projectNames;
    });
    console.log('returning from searchProjectNames. projects #' + projects.length);
    return projects;
}

function getDateTime() {

    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec;

}



