const MEETING_PLACES = [
  "Hut",
  "Canteen",
  "C Block entrance",
  "B Block entrance",
  "Chemistry lab",
  "A Block entrance",
  "Arcade"
];

function isValidMeetingPlace(place) {
  return typeof place === "string" && MEETING_PLACES.includes(place);
}

module.exports = { MEETING_PLACES, isValidMeetingPlace };
