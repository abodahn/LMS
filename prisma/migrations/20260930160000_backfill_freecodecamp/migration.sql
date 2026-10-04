-- freeCodeCamp courses that existed before sourceKey did were backfilled as
-- MANUAL, which kept them in the link sweep that freeCodeCamp's terms forbid.
UPDATE "Course" SET "sourceKey" = 'FREECODECAMP'
  WHERE "url" LIKE '%freecodecamp.org%' OR "platform" LIKE '%freeCodeCamp%';
