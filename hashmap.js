var hashmapSession = {};

exports.auth = auth = {
  set : function(key, value){
    hashmapSession[key] = value;
  },
  get : function(key){
    return hashmapSession[key];
  },
  delete : function(key){
    delete hashmapSession[key];
  },
  all : function(){
    return hashmapSession;
  }
};