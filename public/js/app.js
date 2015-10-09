'use strict';

/* global $, qrcode */

var gCtx = null;
var gCanvas = null;
var stype = 0;
var gUM = false;
var webkit = false;
var moz = false;
var v = null;

var cameraLag = 250;

function initCanvas(w, h) {
  gCanvas = document.getElementById("qr-canvas");
  gCanvas.style.width = w + "px";
  gCanvas.style.height = h + "px";
  gCanvas.width = w;
  gCanvas.height = h;
  gCtx = gCanvas.getContext("2d");
  gCtx.clearRect(0, 0, w, h);
}

function captureToCanvas() {
  if (stype !== 1) {
    return;
  }
  if (gUM) {
    try {
      gCtx.drawImage(v, 0, 0);
      try {
        qrcode.decode();
      } catch (e) {
        setTimeout(captureToCanvas, cameraLag);
      }
    } catch (e) {
      console.log(e);
      setTimeout(captureToCanvas, cameraLag);
    }
  }
}

function success(stream) {
  if (webkit) {
    v.src = window.webkitURL.createObjectURL(stream);
  } else {
    if (moz) {
      v.mozSrcObject = stream;
      v.play();
    } else {
      v.src = stream;
    }
  }
  gUM = true;
  setTimeout(captureToCanvas, cameraLag);
}

function error() {
  gUM = false;
  return;
}

function setwebcam() {
  if (stype === 1) {
    setTimeout(captureToCanvas, cameraLag);
    return;
  }
  var n = navigator;
  v = document.getElementById("v");

  if (n.getUserMedia) {
    n.getUserMedia({
      video: true,
      audio: false
    }, success, error);
  } else {
    if (n.webkitGetUserMedia) {
      webkit = true;
      n.webkitGetUserMedia({
        video: true,
        audio: false
      }, success, error);
    } else {
      if (n.mozGetUserMedia) {
        moz = true;
        n.mozGetUserMedia({
          video: true,
          audio: false
        }, success, error);
      }
    }
  }

  stype = 1;
  setTimeout(captureToCanvas, cameraLag);
}

$(document).ready(function () {
  var currentStory;
  initCanvas(320, 240);
  setwebcam();
  qrcode.callback = function (result) {
    var storyId;
    if (result.indexOf('http') === 0) {
      storyId = result.substring(result.indexOf('story/show') + 11);
    } else {
      storyId = result;
    }
    $('.alert').hide();
    $.get('/info', {
      storyId: storyId
    }).done(function (info) {
      $('#title').html('<a href="//www.pivotaltracker.com/story/show/' + storyId + '" target="_blank">' + info.name + '</a>');
      $('.estimate a, .priority a').removeAttr('disabled');
      currentStory = info;
    }).fail(function (err) {
      $('.error').html(err.responseText).parent().show();
    });
  };
  $('.priority a').click(function () {
    $('.priority a').attr('disabled', 'true');
    $('.alert').hide();
    var priority = $(this).data('priority');
    $.post('/prioritize', {
      storyId: currentStory.id,
      projectId: currentStory.project_id,
      priority: priority
    }).done(function () {
      $('.message')
        .html('Story #' + currentStory.id + ' was prioritized with ' + priority)
        .parent()
        .show();
      $('.history').show();
      setTimeout(captureToCanvas, cameraLag);
    }).fail(function (err) {
      $('.error').html(err.responseText).parent().show();
    });
  });
  $('.estimate a').click(function () {
    $('.estimate a').attr('disabled', 'true');
    $('.alert').hide();
    var estimate = $(this).html().trim();
    $.post('/estimate', {
      storyId: currentStory.id,
      projectId: currentStory.project_id,
      estimate: estimate
    }).done(function () {
      $('.message')
        .html('Story #' + currentStory.id + ' was estimated at ' + estimate + ' points')
        .parent()
        .show();
      $('tbody').append('<tr>' +
        '<td>' + currentStory.id + '</td>' +
        '<td>' + currentStory.name + '</td>' +
        '<td>' + estimate + '</td>' +
        '<td><a href="//www.pivotaltracker.com/story/show/' + currentStory.id + '" target="_blank">Link</a></td>' +
        '</tr>');
      $('.history').show();
      setTimeout(captureToCanvas, cameraLag);
    }).fail(function (err) {
      $('.error').html(err.responseText).parent().show();
    });
  });
});
