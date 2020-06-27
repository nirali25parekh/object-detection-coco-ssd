import React from 'react';
import './App.css';
// import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-cpu';

const cocoSsd = require('@tensorflow-models/coco-ssd')

class App extends React.Component {

  videoRef = React.createRef()
  canvasRef = React.createRef()

  componentDidMount = async () => {

    if (navigator.mediaDevices.getUserMedia) {

      // get media stream promise
      const webcamPromise = navigator.mediaDevices.getUserMedia(
        {
          audio: false,
          video: true
        }
      )
        .then(stream => {
          window.stream = stream  // make variable available to window console
          this.videoRef.current.srcObject = stream;
          return new Promise(resolve => {
            this.videoRef.current.onloadedmetadata = () => {
              resolve();
            };
          });
        },
          // if webcam not loaded
          (error) => {
            console.log("Couldn't start the webcam")
            console.error(error)
          });

      // define model load promise
      const loadlModelPromise = cocoSsd.load()

      // resolve all the Promises
      try {
        const values = await Promise.all([loadlModelPromise, webcamPromise])
        console.log('vidRef', this.videoRef.current)
                        // values gives [0]=> model, [1]=> null
        this.detectFromVideoFrame(values[0], this.videoRef.current) //current frame
      } catch (error) {
        console.error(error);
      }
    }
  }

  // model has function called detect takes current frame
  detectFromVideoFrame = async (model, video) => {
    try {
      const predictions = await model.detect(video)
      // console.log(predictions)
      this.showDetections(predictions);   // show on screen

      requestAnimationFrame(() => { // kind of like setTimeout(), perform regularly
        this.detectFromVideoFrame(model, video);
      });
    }
    catch (error) {
      console.log("Couldn't start the webcam")
      console.error(error)
    };
  };

  showDetections = predictions => {

    // canvas is html element for drawing stuff 
    const ctx = this.canvasRef.current.getContext("2d");
    // console.log('context', ctx)
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // erases previously drawn stuff
    const font = "24px helvetica"
    ctx.font = font
    ctx.textBaseline = "top"

    predictions.forEach(prediction => {
      const x = prediction.bbox[0];  
      const y = prediction.bbox[1];
      const width = prediction.bbox[2];
      const height = prediction.bbox[3];

      // Draw the bounding box.
      ctx.strokeStyle = "#2fff00";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, width, height);  // draws the rect


      // Draw the label background.
      ctx.fillStyle = "#2fff00";    // label background - green
      const textWidth = ctx.measureText(prediction.class).width;
      const textHeight = parseInt(font, 10);

      // draw top left rectangle for label
      ctx.fillRect(x, y, textWidth + 10, textHeight + 10);
      // draw bottom left rectangle for probablity
      ctx.fillRect(x, y + height - textHeight, textWidth + 15, textHeight + 10);

      // Draw the text last to ensure it's on top.
      ctx.fillStyle = "#000000";
      ctx.fillText(prediction.class, x, y);
      ctx.fillText(prediction.score.toFixed(2), x, y + height - textHeight);
    });
  };



  styles = {
    position: 'fixed',
    top: 50, left: 50,
  }

  render() {
    return (
      <div className="App">

        <h1> Coco SSD model object detection</h1>

        {/* for video */}
        <video
          style={this.styles}
          autoPlay
          muted
          ref={this.videoRef}
          width="720"
          height="600"
        />
        {/* for boxes drawing on canvas */}
        <canvas style={this.styles} ref={this.canvasRef} width="720" height="650" />
      </div>
    );
  }
}

export default App;
