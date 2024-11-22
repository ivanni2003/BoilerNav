import React, { useState, useEffect } from "react";

const ScheduleItem = ({ building, index, onPickBuilding, onInsertBuilding, onDeleteBuilding, isStartBuilding }) => {
  // Each schedule item is listed vertically, each with 1. index, 2. building name/gps, 3. building pick button,
  // 4. building insert button, 5. building delete button
  if (isStartBuilding && index === 0) return null;
  const name = building?.tags?.name ?? "Building";
  return (
    <div className="schedule-item">
      <p>{index + 1}.</p>
      <p>{name}</p>
      <button onClick={() => onPickBuilding(index)}>Pick Building</button>
      <button onClick={() => onInsertBuilding(index + 1)}>Insert Building</button>
      <button onClick={() => onDeleteBuilding(index)}>Delete Building</button>
    </div>
  );
};

const FirstScheduleItem = ({ isStartBuilding, schedule, onSetGPS, onPickBuilding, onInsertBuilding }) => {
  // This is the start, and is special because it can be either gps or a building, and can't be deleted
  console.log("isStartBuilding: ", isStartBuilding);
  const name = isStartBuilding ? ( schedule[0]?.tags?.name ?? "Building" ) : "GPS";
  return (
    <div className="schedule-start">
      <p>1.</p>
      <p>{name}</p>
      <button onClick={() => onPickBuilding(0)}>Pick Building</button>
      <button onClick={() => onInsertBuilding(1)}>Insert Building</button>
      { isStartBuilding ? <button onClick={onSetGPS}>Set GPS</button> : null }
    </div>
  );
};

const Schedule = ( { nextBuilding, setSelectBuilding, setNextBuilding, onRouteSchedule, scheduleState, isStartBuildingState, indexInsertState, isReplacingState } ) => {
  const [schedule, setSchedule] = scheduleState;
  const [isStartBuilding, setIsStartBuilding] = isStartBuildingState;
  const [indexInsert, setIndexInsert] = indexInsertState;
  const [isReplacing, setIsReplacing] = isReplacingState;

  const handlePickBuilding = (index) => {
    setIndexInsert(index);
    if (index === 0) {
      setIsStartBuilding(true);
    } else {
      setIsReplacing(true);
    }
    setSelectBuilding(true);
  }

  const handleInsertBuilding = (index) => {
    setIndexInsert(index);
    setIsReplacing(false);
    setSelectBuilding(true);
  }

  const handleDeleteBuilding = (index) => {
    const newSchedule = schedule.filter((building, i) => i !== index);
    setSchedule(newSchedule);
  }

  const handleSetGPS = () => {
    setIsStartBuilding(false);
  };

  useEffect(() => {
    if (!nextBuilding) return;
    // Add nextBuilding to schedule
    // If isReplacing, replace the building at indexInsert
    // console.log("Next building: ", nextBuilding);
    if (isReplacing) {
      console.log("Replacing building at index: ", indexInsert);
      setSchedule((prevSchedule) => {
        return prevSchedule.map((building, index) => {
          if (index === indexInsert) {
            return nextBuilding;
          }
          return building;
        });
      });
    } else {
      console.log("Inserting building at index: ", indexInsert);
      // Insert nextBuilding at indexInsert
      setSchedule(prevSchedule => {
        if (prevSchedule.length > 0 && prevSchedule[indexInsert - 1]?.id === nextBuilding.id) {
          return prevSchedule;
        }
        console.log("Prev schedule: ", prevSchedule);
        const newSchedule = prevSchedule.toSpliced(indexInsert, 0, nextBuilding);
        console.log("New schedule: ", newSchedule);
        return newSchedule;
      });
    }
    setNextBuilding(null);
    // console.log("Schedule updated");
  }, [nextBuilding]);

  useEffect(() => {
    // console.log("Schedule: ", schedule);
    // console.log("isReplacing: ", isReplacing);
  }, [schedule]);

  return (
    <div>
      <h1>Schedule</h1>
      <div className="schedule">
        <FirstScheduleItem
          isStartBuilding={isStartBuilding}
          schedule={schedule}
          onSetGPS={handleSetGPS}
          onPickBuilding={handlePickBuilding}
          onInsertBuilding={handleInsertBuilding}
        />
        {schedule.map((building, index) => (
          <ScheduleItem
            key={index}
            building={building}
            index={index}
            onPickBuilding={handlePickBuilding}
            onInsertBuilding={handleInsertBuilding}
            onDeleteBuilding={handleDeleteBuilding}
            isStartBuilding={isStartBuilding}
          />
        ))}
        <br />
        <button onClick={onRouteSchedule}>Route Schedule</button>
      </div>
    </div>
  );
};

export default Schedule;
