import React, { useState, useEffect, useCallback } from 'react'
import Button from '@material-ui/core/Button';
import Webcam from 'react-webcam'
import { useTheme } from '@material-ui/core/styles'
import useMediaQuery from '@material-ui/core/useMediaQuery'
import * as faceapi from 'face-api.js'
import { IconButton } from '@material-ui/core';
import CameraIcon from '@material-ui/icons/Camera';
import FlipCameraIosIcon from '@material-ui/icons/FlipCameraIos';
import CircularProgress from '@material-ui/core/CircularProgress';
import Backdrop from '@material-ui/core/Backdrop';
import { makeStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import 'custom.scss';

const useStyles = makeStyles((theme) => ({
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
  },
}));

// import { clear } from '@testing-library/user-event/dist/clear';
const WebcamComponent = () => <Webcam />
const size = 1280;
function dataURItoBlob(dataURI) {
  // convert base64/URLEncoded data component to raw binary data held in a string
  var byteString;
  if ( ! dataURI ) return;
  if (dataURI.split(',')[0].indexOf('base64') >= 0)
    byteString = atob(dataURI.split(',')[1]);
  else
    byteString = unescape(dataURI.split(',')[1]);

  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

  // write the bytes of the string to a typed array
  var ia = new Uint8Array(byteString.length);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ia], { type: mimeString });
}

function drawlines(canvas, context, item){

  if (!item) return;
  const { x, y, width, height } = item.box;
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(x + width, y);
  context.lineTo(x + width, y + height);
  context.lineTo(x, y + height);
  context.lineTo(x, y);
  context.lineWidth = 5;
  // line color
  context.strokeStyle = "white";
  context.stroke();
}

const Capture = () => {
  const classes = useStyles();
  const webcamRef = React.useRef(null)
  const imgRef = React.useRef(null)
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.up('md'));
  console.log(matches, ':matches');
  // const { Canvas, Image, ImageData } = canvas

  // console.log(faceapi.nets, ':nets')
  const [picture, setPicture] = useState('')
  const [faceLen, setFaceLen] = useState(null)
  const [faceDetect, setFaceDetect] = useState(true)
  const [facingMode, setFacingMode] = useState('environment')
  const [facePicture, setFacePicture] = useState([])
  const [timer, setTimer] = useState(null)
  const doTimer = () => {
    if (timer) {
      clearTimeout(timer);
      setTimer(null);
    }
    const videoTimout = setTimeout(() => {
      if (webcamRef.current) {
        setFaceDetect(false);
        clearTimeout(timer);
        setTimer(null);
        loadModels();
        console.log('loadModels');
        return;
      }
      doTimer();
    }, 500);
    setTimer(videoTimout)
  }
  const videoConstraints = {
    width: size,
    height: matches ? size * 9 / 16 : size,
    aspectRatio: matches ? 16 / 9 : 1 / 1,
    facingMode: facingMode,
  }
  console.log(matches, ':matches md');

  const Crop = useCallback((rows) => {
  if (!rows || rows.length < 1) return;
  let imgDatasets = [];
    setFaceDetect(true);
    rows.map((item, index) => {
      console.log(item, ':[crop]item waiting');
      const { x, y, width, height } = item?.box;
      const elem = document.createElement('canvas');
      elem.width = width;
      elem.height = height;
      const ctx = elem.getContext('2d');
      // img.width and img.height will contain the original dimensions
      ctx.drawImage(picture, x, y, width, height, 0, 0, width, height);
      ctx.canvas.toBlob((blob) => {
        const file = new File([blob], `face_${index}`, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        console.log(file, ':file');
        const objectURL = URL.createObjectURL(file);
        console.log(objectURL, ':[Crop]objectURL');
        const imgItem = {
          width: width,
          height: height,
          src: objectURL,
        }
        imgDatasets.push(imgItem)
        if (imgDatasets.length === rows.length) {
          setFacePicture(imgDatasets);
          setFaceDetect(false);
          faceapi.draw.drawDetections(document.querySelector('#showDetection'), rows);
        }
      }, 'image/jpeg', 1);
    });
    // console.log(input, ':[Crop]input');
  }, [faceLen, picture])

  /*
  const Crop = (input, index, callBack) => {
    console.log(input, ':[Crop]input');
    console.log(index, ':[Crop]index');
    const elem = document.createElement('canvas');
    elem.width = input.width;
    elem.height = input.height;
    const ctx = elem.getContext('2d');
    // img.width and img.height will contain the original dimensions
    ctx.drawImage(document.querySelector('#shot'), input.x, input.y, input.width, input.height, 0, 0, input.width, input.height);
    const rs = ctx.canvas.toBlob((blob) => {
      const file = new File([blob], `face_${index}`, {
        type: 'image/jpeg',
        lastModified: Date.now()
      });
      console.log(file, ':file');
      const objectURL = URL.createObjectURL(file);
      imgDatasets.push(objectURL)
      console.log(objectURL, ':[Crop]objectURL');
      // console.log(facePicture, ':[Crop]facePicture prev');
    }, 'image/jpeg', 1);
  }
  */
  const DetectFace = async () => {
    const results = await faceapi.detectAllFaces(picture);
    // const canvases = await faceapi.extractFaces([document.querySelector('#shot')])
    // console.log(canvases, ':canvases');
    setFaceLen(results.length);
    // const {x, y, width, height} = results[0];
    // console.log(x, y, width, height, ':[detectFace]x, y, width, height');
    // setFaceDetect(false);
    console.log(results, ':[detectFace] results');
    if (results.length > 0) {
      Crop(results);
    } else {
      setFaceDetect(false);
    }
  }
  const DoCapture = React.useCallback(() => {
    console.log(matches, ':[DoCapture]matches');
    const pictureSrc = matches ? webcamRef.current.getScreenshot() : webcamRef.current.getScreenshot({ width: size, height: size })
    console.log(pictureSrc, ':pictureSrc');
    dataURItoBlob(pictureSrc);
    const objectURL = URL.createObjectURL(dataURItoBlob(pictureSrc));
    const shotImg = new Image();
    setPicture(shotImg);
    shotImg.src = objectURL;
    shotImg.onload = () => {
      // alert(shotImg.width);
      var c = document.getElementById("showDetection");
      c.width = shotImg.width;
      c.height = shotImg.height;
      var ctx = c.getContext("2d");
      ctx.drawImage(shotImg, 0, 0);
    }
    setFaceDetect(true);
  }, [webcamRef, matches, picture])

  const loadModels = async () => {
    const path = "https://justadudewhohacks.github.io/face-api.js/models/"
    await faceapi.nets.ssdMobilenetv1.load('/models')
    // await faceapi.nets.ssdMobilenetv1.loadFromUri(path)
    // await faceapi.nets.faceLandmark68Net.loadFromUri('/models')
    // await faceapi.nets.faceRecognitionNet.loadFromUri('/models')
  }
  useEffect(() => {
    doTimer();
    faceapi.env.monkeyPatch({
      Canvas: HTMLCanvasElement,
      Image: HTMLImageElement,
      ImageData: ImageData,
      Video: HTMLVideoElement,
      createCanvasElement: () => document.createElement('canvas'),
      createImageElement: () => document.createElement('img')
    })
    // console.log(rs, ':rs');
  }, [])

  useEffect(() => {
    console.log(facePicture, ':facePicture');
  }, [facePicture]);

  useEffect(() => {
    console.log(picture, ':picture');
    if (!picture) return;
    DetectFace()
  }, [picture])

  return (
    <>
      <header>

        <h2 className="mb-2 text-center">
          Face Recognition App
        </h2>
      </header>
      <main>

        <div class="container-fluid">

          <div class="row justify-content-center">
            <div class="col-md-6 col-12 position-relative">
              <div className={ classNames("ratio ratio-1x1", { "ratio-16x9" : matches }) }>
              <Backdrop className={classes.backdrop} open={faceDetect}>
        <CircularProgress color="inherit" />
      </Backdrop>
                <Webcam
                  style={{ marginTop: picture ? '-1000em' : '0'}}
                  audio={false}
                  width={'100%'}
                  height={'100%'}
                  imageSmoothing={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={Object.assign(videoConstraints, { facingMode })}
                />
              {picture && (
                <div className="d-flex flex-column">
                {/*
                <img id="shot" src={picture} width={'100%'} ref={imgRef} />
              */}
                <canvas id="showDetection"></canvas>
                </div>
              )}
              </div>
            </div>
          </div>
        <div class="d-flex justify-content-center align-items-center">
          {picture != '' ? (
            <Button
              disabled={faceDetect}
              variant="contained"
              className='mt-3'
              color="primary"
              onClick={(e) => {
                e.preventDefault();
                setPicture('');
                setFaceLen(null);
                setFacePicture([]);
              }}
            >
              Retake
            </Button>
          ) : (
            <Button
              disabled={faceDetect}
              variant="contained"
              color="primary"
              onClick={(e) => {
                e.preventDefault()
                DoCapture()
              }}
              endIcon={<CameraIcon />}
            >
              Capture
            </Button>
          )}
          { ! picture &&
          <IconButton
            disabled={faceDetect}
            color="primary"
            onClick={(e) => {
              e.preventDefault()
              setFacingMode(facingMode === 'user' ? 'environment' : 'user')
            }}
          >
            <FlipCameraIosIcon fontSize="large" />
          </IconButton>
          }
        </div>
        <div className='d-flex justify-content-center'>
          {faceLen !== null ? <span>Face Detected: {faceLen}</span> : null}
        </div>
        <div className='d-flex justify-content-center p-4 flex-wrap'>
          {facePicture?.length > 0 && facePicture.map((item, index) => {
            return (
              <div id={`${index}_img`} key={`${index}_img`} className='d-flex justify-content-center'>
                <img src={item.src} width={ item.width/3 } height={item.height/3} />
              </div>
            )
          })}
        </div>
        </div>
      </main>
    </>
  )
}
export default Capture