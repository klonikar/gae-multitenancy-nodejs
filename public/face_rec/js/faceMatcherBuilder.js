// fetch features of faces from DB and build face matcher
async function createFaceMatcher(responseCallback) {
    invokeGetAPI("/api/v1/faceFeatures/", true, function() {
      
      if(this.readyState == 4 && this.status == 200) {
        let respObj = JSON.parse(this.responseText)
        let faceFeatureMap = new Map()
        respObj.response.forEach(entry => {
            if(faceFeatureMap.has(entry.name)) {
                //console.log(entry.name + " exists.")
                faceFeatureMap.get(entry.name).push(new Float32Array(entry.features))
            }
            else {
                //console.log(entry.name + " does not exist.")
                faceFeatureMap.set(entry.name, [])
                faceFeatureMap.get(entry.name).push(new Float32Array(entry.features))
            }
        })
        const labeledFaceDescriptors = []
        faceFeatureMap.forEach((v, k) => { labeledFaceDescriptors.push(new faceapi.LabeledFaceDescriptors(k, v)) })
        window.faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors)
        responseCallback()
      }
      else if(this.readyState == 4){
          let respObj = JSON.parse(this.responseText)
          document.getElementById("updateStatus").innerHTML = "Failed to retrieve registered faces: " + respObj.message + ", error: " + respObj.error;
          //alert("Error in invoking API. please retry.");
      }
    });
  
}