// Allowed time markers are of the form
// @start(09)@ --> Denotes 9 seconds into the video
// @start(09:10)@ --> Denotes 9 minutes, 10 seconds into the video
// @start(01:09:20)@ --> Denotes 1 hour 9 minutes 20 seconds into the video.
export const startTimeMark = /@start\(([0-9]{1,2})((:[0-9]{1,2})(:[0-9]{1,2})?)?\)@/;
export const endTimeMark = /@end\(([0-9]{1,2})((:[0-9]{1,2})(:[0-9]{1,2})?)?\)@/;

export const startTimeMarkIR = /@start\(([0-9]{1,2})((:[0-9]{1,2})(:[0-9]{1,2})?)?\)@$/;
export const endTimeMarkIR = /@end\(([0-9]{1,2})((:[0-9]{1,2})(:[0-9]{1,2})?)?\)@$/;
