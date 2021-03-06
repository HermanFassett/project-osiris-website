// Load models
var User = require('../models/User');
var Encounter = require('../models/Encounter');
var request = require('request');

/**
 * GET /encounters
 * Encounters page.
 */
exports.getEncounters = function(req, res) {
  Encounter.find({}, function(err, encounter) {
    res.render('encounters', {
      title: 'Encounters',
      encounters: encounter
    });
  });
};

exports.getEncountersByUser = function(req, res) {
  Encounter.find({owner: req.params.owner}, function(err, encounter) {
    res.render('encounters', {
      title: 'Encounters',
      encounters: encounter,
      path: req.path
    })
  });
}

exports.loadEncounter = function(req, res) {
  Encounter.findById(req.params.id, function(err, enc) {
    if (err) {
      req.flash('error', {msg: "Encounter not found."});
      res.redirect('/encounters');
    }
    else {
      res.render('encounter', {
        title: enc.title,
        owner: enc.owner,
        description: enc.description,
        id: enc._id
      })
    }
  });
};

exports.editEncounterView = function(req, res) {
  Encounter.findById(req.params.id, function(err, enc) {
    if (err) {
      req.flash('error', {msg: "Encounter not found."});
      res.redirect('/encounters');
    }
    else {
      res.render('edit', {
        title: enc.title,
        owner: enc.owner,
        description: enc.description,
        id: enc._id
      })
    }
  });
}
// Edit Encounters
exports.editEncounter = function(req, res) {
  // Check for log in
  if (!req.user) {
    req.flash('errors', { msg: "Must log in to edit encounter" });
    return res.redirect('/login');
  }
  // Need a more secure way to get owner, this can easily be faked
  else if (req.body.owner != req.user.profile.name) {
    req.flash('errors', { msg: "You are not the owner of this encounter!"});
    return res.redirect('/encounters');
  }
  console.log(req.body.title, req.body.description);
  var id = req.params.id;
  Encounter.findByIdAndUpdate(id, { description: req.body.description, title: req.body.title }, function(err, enc) {
    req.flash('success', {msg: "Encounter successfully edited!"});
    res.redirect('/encounters');
  });
}

/**
 * GET /encounter
 * Encounter page.
 */
exports.getEncounter = function(req, res) {
  res.render('new', {
    title: 'New Encounter'
  });
};

/**
 * POST /encounter
 * Post an encounter
 */
 
exports.postEncounter = function(req, res) {
  req.assert('title', 'Title cannot be blank').notEmpty();
  req.assert('description', 'Description cannot be empty').notEmpty();

  var errors = req.validationErrors();

  // Check for errors
  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/encounter');
  }

  // Check for log in
  if (!req.user) {
    req.flash('errors', { msg: "Must log in to create encounter" });
    return res.redirect('/login');
  }
  
  var title = req.body.title.replace(/,/g, "");
  var description = req.body.description.replace(/,/g,"");
  
  var encounter = new Encounter({
    owner: req.user.profile.name,
    title: title,
    description: description
  });
  
  encounter.save(function(err) {
    if (err) res.redirect('/');
    else {
      req.flash('success', {msg: "Encounter successfully created!"});
      res.redirect('/encounters');
    }
  })
}

/**
 * Delete Encounter
 * 
 */
exports.deleteEncounter = function(req, res) {
  // Check for log in
  if (!req.user) {
    req.flash('errors', { msg: "Must log in to delete encounter" });
    return res.redirect('/login');
  }
  // Need a more secure way to get owner, this can easily be faked
  else if (req.body.owner != req.user.profile.name) {
    req.flash('errors', { msg: "You are not the owner of this encounter!"});
    return res.redirect('/encounters');
  }

  var id = req.body.id;
  
  Encounter.findById(id).remove(function(err) {
    req.flash('success', {msg: "Encounter successfully deleted!"});
    res.redirect('/encounters');
  });
}

/**
 *  Download encounter as CSV
 */
 
exports.downloadEncounter = function(req, res) {
  req.assert('title', 'Title cannot be blank').notEmpty();
  req.assert('description', 'Description cannot be empty').notEmpty();

  var errors = req.validationErrors();

  // Check for errors
  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/encounter');
  }

  // Check for log in
  if (!req.user) {
    req.flash('errors', { msg: "Must log in to download encounter" });
    return res.redirect('/login');
  }

  //Generate CSV
  var title = req.body.title.replace(/,/g, "");
  var description = req.body.description.replace(/,/g,"");

  var csv = [["title", "description"], [title, description]];
  var csvContent = "";//"data:text/csv;charset=utf-8,";
  csv.forEach(function(infoArray, index){
    dataString = infoArray.join(",");
    csvContent += index < csv.length ? dataString+ "\n" : dataString;
  });

  // Download CSV
  res.setHeader('Content-disposition', 'attachment; filename='+title.replace(/\s/g, "_")+'.csv');
  res.set('Content-Type', 'text/csv');
  res.status(200).send(csvContent);
};

exports.downloadAllEncounters = function(req, res) {
  Encounter.find({}, function(err, encounter) {
    var csv = [["title", "description"]];
    var csvContent = "";
    encounter.forEach(function(enc, ind) {
      csv.push([enc.title, enc.description]);
    });
    csv.forEach(function(infoArray, index){
      dataString = infoArray.join(",");
      csvContent += index < csv.length ? dataString+ "\n" : dataString;
    });
    // Download CSV
    res.setHeader('Content-disposition', 'attachment; filename=all_encounters.csv');
    res.set('Content-Type', 'text/csv');
    res.status(200).send(csvContent);
  });
}

exports.downloadEncountersByUser = function(req, res) {
  Encounter.find({owner: req.params.owner}, function(err, encounter) {
    var csv = [["title", "description"]];
    var csvContent = "";
    encounter.forEach(function(enc, ind) {
      csv.push([enc.title, enc.description]);
    });
    csv.forEach(function(infoArray, index){
      dataString = infoArray.join(",");
      csvContent += index < csv.length ? dataString+ "\n" : dataString;
    });
    // Download CSV
    res.setHeader('Content-disposition', 'attachment; filename='+req.params.owner.replace(/\s/g, "_")+'_encounters.csv');
    res.set('Content-Type', 'text/csv');
    res.status(200).send(csvContent);
  });
}
