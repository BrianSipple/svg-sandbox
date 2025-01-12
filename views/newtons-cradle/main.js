'use strict';

import TweenMax from "TweenMax";
import Draggable from "Draggable";
import Bearing from './models/bearing';

const SELECTORS = {
  bearingGroups: '.bearing',
  bearingGroup0: '.bearing--0',
  bearingGroup1: '.bearing--1',
  bearingGroup2: '.bearing--2',
  bearingGroup3: '.bearing--3',
  bearingGroup4: '.bearing--4',
  bearingBall0: '.bearing--0 .ball',
  bearingBall1: '.bearing--1 .ball',
  bearingBall2: '.bearing--2 .ball',
  bearingBall3: '.bearing--3 .ball',
  bearingBall4: '.bearing--4 .ball',
  group0ControlPoint: '.bearing--0 .control-point',
  group1ControlPoint: '.bearing--1 .control-point',
  group2ControlPoint: '.bearing--2 .control-point',
  group3ControlPoint: '.bearing--3 .control-point',
  group4ControlPoint: '.bearing--4 .control-point',
  instructionToast: '.instruction-toast',
  sceneElem: '.newtons-cradle'
};

const CLASS_NAMES = {
  isVisible: 'is-visible',
  isHidden: 'is-hidden'
};

/* Direction constants to test the ouput of a Draggable event's `getDirection()` method */
const DIRECTIONS = {
  CLOCKWISE: 'clockwise',
  COUNTER_CLOCKWISE: 'counter-clockwise'
};

const DURATIONS = {
  fadeIn: 0.4,
  slideIn: 0.6
};

const EASINGS = {
  fadeIn: Power3.easeOut,
  slideInSmallBounce: Back.easeOut.config(1.25)
};

const LABELS = {
  sceneVisible: 'sceneVisible'
};

const DATA_ATTRIBUTES = {
  bearingIndex: 'data-bearing-idx'
};

const MAX_ANGULAR_ROTATION = 85;

const BEARING_OBJECTS = [];



const NewtonsCradle = (function newtonsCradle () {

  let
    DOM_REFS,
    objectsInDrag,
    masterTL,
    masterDraggable;

  let isCradleSwinging = false;

  function cacheDOMState () {

    const querySelector = document.querySelector.bind(document);
    const querySelectorAll = document.querySelectorAll.bind(document);

    DOM_REFS = {

      bearingGroups: {
        group0: {
          bearingElem: querySelector(SELECTORS.bearingGroup0),
          ballElem: querySelector(SELECTORS.bearingBall0),
          controlPointElem: querySelector(SELECTORS.group0ControlPoint)
        },
        group1: {
          bearingElem: querySelector(SELECTORS.bearingGroup1),
          ballElem: querySelector(SELECTORS.bearingBall1),
          controlPointElem: querySelector(SELECTORS.group1ControlPoint)
        },
        group2: {
          bearingElem: querySelector(SELECTORS.bearingGroup2),
          ballElem: querySelector(SELECTORS.bearingBall2),
          controlPointElem: querySelector(SELECTORS.group2ControlPoint)
        },
        group3: {
          bearingElem: querySelector(SELECTORS.bearingGroup3),
          ballElem: querySelector(SELECTORS.bearingBall3),
          controlPointElem: querySelector(SELECTORS.group3ControlPoint)
        },
        group4: {
          bearingElem: querySelector(SELECTORS.bearingGroup4),
          ballElem: querySelector(SELECTORS.bearingBall4),
          controlPointElem: querySelector(SELECTORS.group4ControlPoint)
        }
      },

      instructionToastElem: querySelector(SELECTORS.instructionToast),
      sceneElem: querySelector(SELECTORS.sceneElem)

    };

    // sort the array of bearing groups according to their index
    DOM_REFS.sortedBearingGroupElems = Array.from(querySelectorAll(SELECTORS.bearingGroups)).sort((a, b) => {
      const idxA = Number(a.getAttribute(DATA_ATTRIBUTES.bearingIndex));
      const idxB = Number(b.getAttribute(DATA_ATTRIBUTES.bearingIndex));
      return idxA - idxB;
    });
  }


  function initializeBearingObjects () {

    let
      bearingGroup,
      bearingElem,
      bearingLength,
      bearingControlPointCoords,
      bearingBallElem;
    Object.keys(DOM_REFS.bearingGroups).forEach((bearingGroupKey, idx) => {

      bearingGroup = DOM_REFS.bearingGroups[bearingGroupKey];
      bearingElem = bearingGroup.bearingElem;
      bearingControlPointCoords = {
        x: bearingGroup.controlPointElem.getAttribute('cx'),
        y: bearingGroup.controlPointElem.getAttribute('cy')
      };
      bearingLength = Math.abs(
        Number(bearingGroup.ballElem.getAttribute('cy')) -
        Number(bearingGroup.controlPointElem.getAttribute('cy'))
      );

      BEARING_OBJECTS.push(
        Bearing({
          massKG: 0.5,  // kilograms
          position: idx,
          MAX_ANGLE: MAX_ANGULAR_ROTATION,
          bearingLengthMeters: bearingLength,
          elem: bearingElem,
          masterTL: new TimelineMax(),
          controlPointCoords: bearingControlPointCoords
        })
      );

    });
  }

  /**
  * FOR NOW: Don't allow any more dragging once the swinging starts
  * Exploration into how to best handle this is still ongoing (http://greensock.com/forums/topic/8925-draggable-disable-enable/ )
  */
  function setBearingDraggability (isDraggable) {
    DOM_REFS.sortedBearingGroupElems.forEach(el => el.style.pointerEvents = isDraggable ? 'all' : 'none');
  }

  function onSwingSeriesEnd () {
    if (isCradleSwinging) {
      isCradleSwinging = false;
      toggleInstructionToast();
      setBearingDraggability(true);
    }
  }

  /**
  * Prepare bearing elements for the animation
  */
  function syncBearingsWithAnimationScene () {

    for (const bearingObject of BEARING_OBJECTS) {
      TweenMax.set(bearingObject.elem, {
        svgOrigin: `${bearingObject.controlPointCoords.x} ${bearingObject.controlPointCoords.y}`,
        rotation: 0
      });
      masterTL.add(bearingObject.masterTL);
    }
  }

  function findBearingsToSwingOnCollision (directionOfForce, numberOfBearingsToSwing) {
    return directionOfForce > 0 ?
      BEARING_OBJECTS.slice(0, numberOfBearingsToSwing)
      :
      BEARING_OBJECTS.slice(-numberOfBearingsToSwing);
  }

  /**
  * Callback for when a bearing returns from its outward, extended state and
  * collides with its neighbor.
  */
  function onCollision (collidingBearingObj, collisionOpts) {

    const destinationAngle = collisionOpts.destinationAngle;
    const kineticEnergyOnCollision = collisionOpts.kineticEnergyOnCollision;
    const energyDampingDecrement = collisionOpts.energyDampingDecrement || 0;
    const accelerationTransferred = collisionOpts.accelerationTransferred;
    const numBearingsInMotion = collisionOpts.numBearingsInMotion;

    const directionOfForce = collidingBearingObj.getDirection();
    const bearingsToSwing = findBearingsToSwingOnCollision(directionOfForce, numBearingsInMotion);

    // Create swing TLs for static bearings while there's still energy left to be transfered
    bearingsToSwing.forEach((bearing, idx) => {

      bearing.setDirection(directionOfForce);
      bearing.swing({

        // going left, the returning collision instigator will be the bearing at the last index
        // going right, the returning collision instigator will be the bearing at the first index
        willInstigateCollision: directionOfForce > 0 ?
          (idx === bearingsToSwing.length - 1)
          :
          (idx === 0),
        kineticEnergyTransferred: kineticEnergyOnCollision - (energyDampingDecrement * (bearingsToSwing.length)),
        accelerationTransferred,
        outwardAngle: destinationAngle,
        returnAngle: 0,
        numBearingsInMotion,
        collisionCallback: onCollision,
        swingSeriesCompleteCallback: onSwingSeriesEnd,
      });

    });
  }


  function createSwingTLsAfterDrag (currentRotationOfDragged, positionOfDragged) {
    console.log('Start Swing');
    isCradleSwinging = true;
    const bearingsInMotion = BEARING_OBJECTS.filter(obj => obj.isInMotion);
    const numBearingsInMotion = bearingsInMotion.length;

    bearingsInMotion.forEach((obj, idx) => {
      obj.swing({
        willInstigateCollision: obj.position == positionOfDragged,
        numBearingsInMotion,
        kineticEnergyTransferred: 0,
        outwardAngle: currentRotationOfDragged,
        returnAngle: 0,
        collisionCallback: onCollision,
        swingSeriesCompleteCallback: onSwingSeriesEnd
      });

    });
  }

  function updateBallTLOnDrag () {

    let debugString = `Dragging `;

    objectsInDrag.forEach((bearingObj) => {
      debugString += `------${bearingObj.position}-----`;
      bearingObj.theta = this.rotation;
      bearingObj.masterTL.to(bearingObj.elem, 0.01, { rotation: this.rotation });
    });

    console.log(debugString);
  }

  function swingBallsAfterDrag () {
    setBearingDraggability(false);
    createSwingTLsAfterDrag(
      this.rotation,
      this.target.getAttribute(DATA_ATTRIBUTES.bearingIndex)
    );
  }



  function toggleInstructionToast (isClickable) {
    DOM_REFS.instructionToastElem.classList.toggle(CLASS_NAMES.isHidden);
    DOM_REFS.instructionToastElem.classList.toggle(CLASS_NAMES.isVisible);
  }

  function onDragStart () {

    const bearingIdx = Number(this.target.getAttribute(DATA_ATTRIBUTES.bearingIndex));
    const swingDirection = this.getDirection();
    const swingDirectionWeight = swingDirection === DIRECTIONS.CLOCKWISE ? 1 : -1;

    toggleInstructionToast();

    // test direction by
    objectsInDrag = swingDirection === DIRECTIONS.CLOCKWISE ?
      BEARING_OBJECTS.slice(0, bearingIdx + 1) :
      BEARING_OBJECTS.slice(bearingIdx);

    for (const obj of objectsInDrag) {
      obj.isInMotion = true;
      obj.setDirection(swingDirectionWeight);
    }
  }


  /**
   * Unveil the scene and create the Draggable instance
   */
  function exposeScene () {

    const unveilingTL = new TimelineMax({ onComplete: createDraggable });
    const { instructionToastElem, sceneElem, sortedBearingGroupElems } = DOM_REFS;
    const { fadeIn: fadeInDuration } = DURATIONS;
    const { fadeIn: fadeInEase } = EASINGS;
    const { isVisible: visibleClass, isHidden: hiddenClass } = CLASS_NAMES;
    const { sceneVisible: sceneVisibleLabel } = LABELS;

    unveilingTL.to(sceneElem, fadeInDuration, { autoAlpha: 1, ease: fadeInEase });

    unveilingTL.addLabel(sceneVisibleLabel);

    unveilingTL.set(instructionToastElem, { className: `+=${visibleClass}` }, `${sceneVisibleLabel}+=0.3`);
    unveilingTL.set(instructionToastElem, { className: `-=${hiddenClass}` }, `${sceneVisibleLabel}+=0.3`);
    unveilingTL.set(sortedBearingGroupElems, { pointerEvents: 'all', cursor: 'pointer' });
  }

  function createDraggable () {

    Draggable.create(DOM_REFS.sortedBearingGroupElems, {
      type: 'rotation',
      throwProps: true,
      bounds: {
        minRotation: -MAX_ANGULAR_ROTATION,
        maxRotation: MAX_ANGULAR_ROTATION
      },
      onDragStart: onDragStart,
      onDrag: updateBallTLOnDrag,
      onDragEnd: swingBallsAfterDrag
    });
  }



  function run () {

    masterTL = new TimelineMax();

    cacheDOMState();
    initializeBearingObjects();
    syncBearingsWithAnimationScene();
    createDraggable();
    exposeScene();
  }


  return {
    run
  };

}());

export default NewtonsCradle;
