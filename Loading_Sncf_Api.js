
//----------------Recuperation de la date Now et Until au format SNCF----------------------------------------
  var mois = new Array("01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12");
  var dte =new Date();
  var until;
  var minutes=dte.getMinutes();
  var heures=dte.getHours();
  var jour = dte.getDate();
  if(minutes<10)minutes="0"+minutes;
  if(heures<10)heures="0"+heures;
  if(jour<10)jour="0"+jour;
  var timeNow=dte.getFullYear()+mois[dte.getMonth()]+jour+"T"+heures+minutes+"00";
  
  if(dte.getHours()==23 || dte.getHours()==00 )
  {
    if(dte.getHours()==00)
    {
      until =dte.getFullYear()+mois[dte.getMonth()]+(jour+1)+"T"+'00'+minutes+"00";
    }else {
      until =dte.getFullYear()+mois[dte.getMonth()]+(jour+1)+"T"+(heures+1)+minutes+"00";
    }
    
  }else {
    until =dte.getFullYear()+mois[dte.getMonth()]+jour+"T"+(heures+1)+minutes+"00";
  }
  var url="https://api.sncf.com/v1/coverage/sncf/disruptions/?since="+timeNow+"&count=300&until="+until;


    //Convertie le temps SNCF en minutes exploitables
    function timeConverter(t)
    {
      var hours=t.match(/[0-9]{2}/);
      if(hours=="00")hours="24";
      var min=t.match(/[0-9]{4}$/)/100;
      //var PmAm=['01','02','03','04','05','06','07','08','09','10','11','12','01','02','03','04','05','06','07','08','09','10','11','12'];
      //var europTime=['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23','00'];
      hours=hours*60+min;
      return hours;
    }


    //---------------------Requete au serveur------------------------
    function buffering()
    {
        var Resp;
        var req = new XMLHttpRequest();
        req.onreadystatechange= function(){
            if (this.readyState == 4 && this.status == 200)
            {
                Resp=this.responseText;

         }else if(this.readyState == 3 || this.readyState == 2)
         {
            document.getElementById("load").innerHTML="Chargement en cours ...";
         }else if(this.readyState == 1){
            document.getElementById("block").innerHTML="<p>Préchargement ...</p>";
         }else {
             document.getElementById("test").innerHTML="Serveur Injoignable: "+this.status;
         }
        };
        req.open("GET",url,false);// Attention Requête Synchrone !!!
	//LE MOT DE PASSE A EVIDEMMENT ETE SUPPRIME
        req.setRequestHeader("Authorization","Basic ");
        //req.setRequestHeader("Content-Type:","application/json");
        req.send();
        return Resp;
    }

     //---------------------------Recuperation et tri de la requête-----------------------------------------
      //Parse du code JSON (retourne une erreur si le serveur est injoignable)
            try {

                var myObj = JSON.parse(buffering());

            } catch (e) {
              document.getElementById("block").innerHTML='<p>'+e+'</p><br>'+url;

            }

            //Création du tableau
            var table='<tr id="trHead"><th>Numéro</th><th>ID Unique</th><th>Lignes</th><th>Cause</th><th>Retard</th><th>Status</th><th>Effet</th><th>Derniere mise à jour</th></tr>';
            for(i=0;i<myObj.disruptions.length;i++)
            {

                var cause;
                var Lignes;
                var retard;
                var Lpath;
                var Lcause;
                var Ldep;
                var Larr;
                var arr;
                var dep;

                //Recherche du messages à l'origine du retard
                try {
                  cause=myObj.disruptions[i].impacted_objects[0].impacted_stops[myObj.disruptions[i].impacted_objects[0].impacted_stops.length-1].cause;
                  Lcause='myObj.disruptions['+i+'].impacted_objects[0].impacted_stops['+(myObj.disruptions[i].impacted_objects[0].impacted_stops.length-1)+'].cause';
                  if(cause=="")cause="Non renseigné";
                } catch (e) {
                  try {
                    cause=myObj.disruptions[i].messages[0].text;
                    Lcause='myObj.disruptions['+i+'].messages[0].text';
                  } catch (f) {
                    cause='Erreur Json isolé'+myObj.disruptions[i].severity.name;
                  }
                }finally{
                  document.getElementById("block").innerHTML='<p>Erreur <a href="'+ url+'">Lien</a>'+'----id='+i+'</p>'
                }

                //Recherche de la Ligne
                try {
                  Lignes=myObj.disruptions[i].impacted_objects[0].impacted_stops[0].stop_point.name+' - '+myObj.disruptions[i].impacted_objects[0].impacted_stops[myObj.disruptions[i].impacted_objects[0].impacted_stops.length-1].stop_point.name;
                  Lpath='myObj.disruptions['+i+'].impacted_objects[0].impacted_stops['+(myObj.disruptions[i].impacted_objects[0].impacted_stops.length-1)+'].stop_point.name';
                } catch (p) {
                  Lignes="Trajet Supprimé";
                }

                //Calcul du retard et conversion du resultat retouné (ne retourne rien si le trajet est supprimé)
                try {
                      var eff=myObj.disruptions[i].impacted_objects[0].impacted_stops[myObj.disruptions[i].impacted_objects[0].impacted_stops.length-1].stop_time_effect;
                      if(eff!="unchanged")
                      {
                        if(eff!="deleted")
                        {
                          Larr=myObj.disruptions[i].impacted_objects[0].impacted_stops[myObj.disruptions[i].impacted_objects[0].impacted_stops.length-1].amended_arrival_time;
                          Ldep= myObj.disruptions[i].impacted_objects[0].impacted_stops[myObj.disruptions[i].impacted_objects[0].impacted_stops.length-1].base_arrival_time;


                          if(Number.isNaN(retard))
                          {
                            retard="Arrivé estimée:"+myObj.disruptions[i].impacted_objects[0].impacted_stops[myObj.disruptions[i].impacted_objects[0].impacted_stops.length-1].amended_departure_time;
                          }else {
                            retard=timeConverter(Larr)-timeConverter(Ldep);
                            retard=retard+" minutes";
                          }

                        }else {
                          retard="Pas de Retard"
                        }
                      }else {
                        retard="Pas de Retard"
                      }

                } catch (e) {
                  retard=""
                }

                //Incrementation de la ligne du tableau
                table=table+'<tr id="'+i+'"><td>'+i+'</td><td>'+myObj.disruptions[i].disruption_id+'</td><td>'+Lignes+'<p class="path">Chemin: '+Lpath+'</p></td><td>'+cause+'<p class="path">Chemin: '+Lcause+'</p></td><td>'+retard+'<p class="path">'+Larr+'-'+Ldep+'</p></td><td>'+myObj.disruptions[i].status+'</td><td>'+myObj.disruptions[i].severity.effect+'</td><td>'+myObj.disruptions[i].updated_at+'</td></tr>';

            }

            document.getElementById('count').innerHTML="<p>"+myObj.disruptions.length+" trajets actuelles</p>";
            document.getElementById("block").innerHTML='<table style="width:100%"><tbody>'+table+'</tbody></table>';

            //Lien vers la requête JSON(pour de plus ample recherche)
            document.getElementById("error").innerHTML='Lien: <a href="'+url+'">https://api.sncf.com/v1/coverage/sncf/disruptions//?since='+timeNow+'&count=300&until='+until+'</a>';
