const Thermostat = require('../Thermostat');
const { ProgrammedSettings, Period, DayType } = require('../ProgrammedSettings');

//test Thermostat
describe('Thermostat turnHeaterOn - Coverage Tests', () => {
  let thermostat;
  let settings;

  //每次Test都會執行一次
  beforeEach(() => {
    thermostat = new Thermostat();
    settings = new ProgrammedSettings();

    thermostat.period = Period.MORNING;
    thermostat.day = DayType.WEEKDAY;

    //targetTemp = 70
    settings.setSetting(Period.MORNING, DayType.WEEKDAY, 70);
  });

  // C1 = True, C2 = True, P = True
  test('T1: C1=true, C2=true → Heater ON (PC, CC, CACC)', () => {
    thermostat.setCurrentTemp(60);        // curTemp
    thermostat.thresholdDiff = 5;         // C1：(targetTemp - curTemp) > thresholdDiff == True
    thermostat.timeSinceLastRun = 5;      // C2：timeSinceLastRun >= minLag == True
    thermostat.minLag = 3;

    const result = thermostat.turnHeaterOn(settings);
    expect(result.heaterOn).toBe(true);
    expect(result.runTime).toBe(10);
  });

  // C1 = False, C2 = True, P = False
  test('T2: C1=false, C2=true → Heater OFF (PC, CC, CACC)', () => {
    thermostat.setCurrentTemp(71); // (70-71) > 5 == False
    thermostat.thresholdDiff = 5;
    thermostat.timeSinceLastRun = 5;
    thermostat.minLag = 3;

    const result = thermostat.turnHeaterOn(settings);
    expect(result.heaterOn).toBe(false);
    expect(result.runTime).toBe(0);
  });

  // C1 = True, C2 = False, P = False
  test('T3: C1=true, C2=false → Heater OFF (CC, CACC)', () => {
    thermostat.setCurrentTemp(60);
    thermostat.thresholdDiff = 5;
    thermostat.timeSinceLastRun = 2; // timeSinceLastRun >= minLag == False
    thermostat.minLag = 3;

    const result = thermostat.turnHeaterOn(settings);
    expect(result.heaterOn).toBe(false);
    expect(result.runTime).toBe(0);
  });

  //Test Override mode
  test('Override active → uses override temperature', () => {
    thermostat.setCurrentTemp(60);
    thermostat.setOverride(75);             
    thermostat.thresholdDiff = 5;
    thermostat.timeSinceLastRun = 5;
    thermostat.minLag = 3;

    const result = thermostat.turnHeaterOn(settings);
    expect(result.heaterOn).toBe(true);     // 60 < 75 - 5 → true
  });
   
  //Test Clear Override mode
  test('clearOverride disables override mode', () => {
    thermostat.setOverride(75);
    expect(thermostat.override).toBe(true);
    thermostat.clearOverride();
    expect(thermostat.override).toBe(false);
  }); 

});


//額外：test ProgrammedSettings
describe('ProgrammedSettings - Coverage Completion', () => {

  //Test getSetting()
  test('getSetting returns default 65 for invalid keys', () => {
    const settings = new ProgrammedSettings();
    expect(settings.getSetting('NOT_A_PERIOD', 'BAD_DAY')).toBe(65);
  });

  //Test setSetting()
  test('setSetting does not crash on invalid keys', () => {
    const settings = new ProgrammedSettings();
    settings.setSetting('INVALID_PERIOD', 'INVALID_DAY', 100);
  });

  //Test setSetting() & getSetting()
  test('getSetting returns updated value', () => {
    const settings = new ProgrammedSettings();
    settings.setSetting(Period.EVENING, DayType.WEEKEND, 66);
    expect(settings.getSetting(Period.EVENING, DayType.WEEKEND)).toBe(66);
  });

  //Test toString()
  test('toString returns JSON string', () => {
    const settings = new ProgrammedSettings();
    const json = settings.toString();
    expect(typeof json).toBe('string');
    expect(json).toContain('WEEKDAY');
  });

});
