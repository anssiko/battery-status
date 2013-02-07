/*globals $*/
var _BATTERYLOW_THRESHOLD = 20,
    _BATTERYCRITICAL_THRESHOLD = 10,
    _BATTERY_CHARGING_INTERVAL = 1000,
    _BATTERY_DEPLETING_INTERVAL = 500,
    _battery,
    _battery_charging,
    _battery_depleting;

function BatteryStatusEventSource() {
  // _battery is a singleton
  if (typeof _battery === 'undefined') {
    _battery = this;
  }
  return _battery;
}

BatteryStatusEventSource.prototype = {
  e: { type: '', isPlugged: true, level: null, status: null },
  onbatterystatus: null,
  onbatterylow: null,
  onbatterycritical: null,
  onbatteryok: null,
  // TODO: we cheat a bit and do not implement event capture
  // or support for multiple event listeners of the same type
  addEventListener: function (type, listener, capture) {
    if (listener === null) {
        return;
    }
    _battery['on' + type] = function () { listener(_battery.e); };
  },
  removeEventListener: function (type, listener, capture) {
    _battery['on' + type] = null;
  }
};

//---------------------------------------------------------------------------//

function fire(status) {
  _battery.e.type = 'battery' + status;
  
  if (status !== 'ok' && status === _battery.e.status) {
    return;
  }
  
  if (status === 'low' || status === 'critical' || status === 'ok') {
    _battery.e.status = status;
  }
  
  try {
    _battery['onbattery' + status](_battery.e);
  } catch (ex) {
    console.log('onbattery' + status + ' event handler is null');
  }
}

function onLevelChange(level) {
  _battery.e.level = parseInt(level, '10');
  $('levelmeter').innerHTML = level;
  
  if (!_battery.e.isPlugged) {
    if (level < _BATTERYCRITICAL_THRESHOLD) {
      fire('critical');
    } else if (level < _BATTERYLOW_THRESHOLD) {
      fire('low');
    }
  }
  fire('status');
}

function onIsPluggedChange(isPlugged) {
  _battery.e.isPlugged = isPlugged;
  
  if (isPlugged) {
    // simulate charging
    fire('ok');

    _battery_charging = setInterval(function () {
      if (typeof _battery_depleting !== 'undefined') {
        clearTimeout(_battery_depleting);
      }
      
      var level = $('level');
      try {
        level.stepUp(1);
        onLevelChange(level.value);
      } catch (ex) {
        clearTimeout(_battery_charging);
      }
    }, _BATTERY_CHARGING_INTERVAL);
  } else {
    // simulate depleting
    if (typeof _battery_charging !== 'undefined') {
      clearTimeout(_battery_charging);
    }
    
    _battery_depleting = setInterval(function () {
      var level = $('level');
      try {
        level.stepDown(1);
        onLevelChange(level.value);
      } catch (ex) {
        clearTimeout(_battery_depleting);
      }
    }, _BATTERY_DEPLETING_INTERVAL);
  }
  
}

//---------------------------------------------------------------------------//

function $(id) {
  return document.getElementById(id);
}

function isInputTypeRangeSupported() {
  var i = document.createElement('input');
  i.setAttribute('type', 'range');
  return i.type !== 'text';
}

window.onload = function () {
  if (!isInputTypeRangeSupported()) {
    $('warning').innerHTML =
      'Your browser does not support &lt;input type="range"&gt;, ' +
      'which means this demo will be crippled.';
    $('warning').style.display = 'block';
  }
  onIsPluggedChange(false);
  $('level').addEventListener('change', function () { onLevelChange(this.value); }, false);
  $('isplugged').addEventListener('change', function () { onIsPluggedChange(this.checked); }, false);
};