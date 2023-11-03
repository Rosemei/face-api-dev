import React, { useState, useEffect } from 'react'
import Button from '@material-ui/core/Button';
import Webcam from 'react-webcam'
import { useTheme } from '@material-ui/core/styles'
import useMediaQuery from '@material-ui/core/useMediaQuery'
import * as faceapi from 'face-api.js'
import { IconButton } from '@material-ui/core';
import CameraIcon from '@material-ui/icons/Camera';
import FlipCameraIosIcon from '@material-ui/icons/FlipCameraIos';
import CircularProgress from '@material-ui/core/CircularProgress';

import 'custom.scss';
const WebcamComponent = () => <Webcam />
const size = 1280;
function dataURItoBlob(dataURI) {
  // convert base64/URLEncoded data component to raw binary data held in a string
  var byteString;
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

const Capture = () => {
  const webcamRef = React.useRef(null)
  const imgRef = React.useRef(null)
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.up('lg'));
  // const { Canvas, Image, ImageData } = canvas
  faceapi.env.monkeyPatch({
    Canvas: HTMLCanvasElement,
    Image: HTMLImageElement,
    ImageData: ImageData,
    Video: HTMLVideoElement,
    createCanvasElement: () => document.createElement('canvas'),
    createImageElement: () => document.createElement('img')
  })
  // console.log(faceapi.nets, ':nets')
  const [picture, setPicture] = useState('')
  const [faceLen, setFaceLen] = useState(null)
  const [faceDetect, setFaceDetect] = useState(true)
  const [ facingMode, setFacingMode ] = useState('user')
  const [ facePicture, setFacePicture ] = useState([])
  const videoInterval = setInterval(() => {
    if (webcamRef.current) {
      setFaceDetect(false);
      clearInterval(videoInterval);
    }
  }, 250);
  const videoConstraints = {
    width: size,
    aspectRatio: matches ? 16 / 9 : 1 / 1,
    facingMode: facingMode,
  }
  console.log(matches, ':matches md');

const Crop = (input, index) => {
    console.log(input, ':[Crop]input');
    const elem = document.createElement('canvas');
    elem.width = input.width;
    elem.height = input.height;
    const ctx = elem.getContext('2d');
    // img.width and img.height will contain the original dimensions
    ctx.drawImage(document.querySelector('#shot'), input.x, input.y, input.width, input.height, 0, 0, input.width, input.height);
    ctx.canvas.toBlob((blob) => {
        const file = new File([blob], `face_${index}`, {
            type: 'image/jpeg',
            lastModified: Date.now()
        });
        console.log(file, ':file');
        const objectURL = URL.createObjectURL(file);
        console.log(objectURL, ':[Crop]objectURL');
    const f = facePicture.concat(objectURL);
    setFacePicture(f);
    }, 'image/jpeg', 1);
  }
  const DetectFace = async () => {
    setFaceDetect(true);
    const results = await faceapi.detectAllFaces(document.querySelector('#shot'))
    // const canvases = await faceapi.extractFaces([document.querySelector('#shot')])
    // console.log(canvases, ':canvases');
    setFaceLen(results.length);
    // const {x, y, width, height} = results[0];
    // console.log(x, y, width, height, ':[detectFace]x, y, width, height');
    setFaceDetect(false);
    console.log(results[0].box, ':[detectFace] results');
    results.map((item, index) => {
      console.log(item, ':item');
      const {x, y, width, height} = item.box;
      Crop({x, y, width, height}, index);
    });

  }
  const DoCapture = React.useCallback(() => {
    const pictureSrc = matches ? webcamRef.current.getScreenshot() : webcamRef.current.getScreenshot({ width: size, height: size })
    console.log(pictureSrc, ':pictureSrc');
    dataURItoBlob(pictureSrc);
    const objectURL = URL.createObjectURL(dataURItoBlob(pictureSrc));
    setPicture(objectURL);
    setTimeout(() => {
      DetectFace()
    }, 500)
  })

  const loadModels = async () => {
    await faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
    // await faceapi.nets.faceLandmark68Net.loadFromUri('/models')
    // await faceapi.nets.faceRecognitionNet.loadFromUri('/models')
  }
  useEffect(() => {
    const rs = loadModels()
    // console.log(rs, ':rs');
  }, [])

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
              { faceDetect ? <div className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center"><CircularProgress /></div> : null }
              {picture == '' ? (
                <Webcam
                  audio={false}
                  width={'100%'}
                  height={'100%'}
                  imageSmoothing={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={Object.assign(videoConstraints, {facingMode })}
                />
              ) : (
                <img id="shot" src={picture} width={'100%'} ref={imgRef} />
              )}
            </div>
          </div>
        </div>
        <div class="d-flex justify-content-center align-items-center">
          {picture != '' ? (
            <Button
              disabled={faceDetect}
              variant="contained"
              color="primary"
              endIcon={<CameraIcon />}
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
          <IconButton
            disabled={faceDetect}
            color="primary"
            onClick={(e) => {
              e.preventDefault()
              setFacingMode(facingMode === 'user' ? 'environment' : 'user')
            }}
          >
          <FlipCameraIosIcon fontSize="large"/>
          </IconButton>
        </div>
        <div className='d-flex justify-content-center'>
          {faceLen !== null ? <span>Face Detected: {faceLen}</span> : null}
        </div>
        <div>
        { facePicture?.length > 0 && facePicture.map((item, index) => {
          return (
            <div className='d-flex justify-content-center'>
              <img src={item} width={matches ? 200 : 100} />
            </div>
          )
        })}
        </div>
      </main>
    </>
  )
}
export default Capture