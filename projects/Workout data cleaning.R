library(dplyr)
library(janitor)
library(lubridate)

workouts <- read.csv("user202919653_workout_history.csv") |>
  clean_names() |>
  select(workout_date, activity_type, distance_km)

workouts$workout_date <- mdy(workouts$workout_date)

workouts <- workouts |>
  mutate(distance_class = case_when(
    distance_km <= 5 ~ "0-5 km",
    distance_km <= 10 ~ "5-10 km",
    distance_km <= 15 ~ "10-15 km",
    TRUE ~ "15+ km"
  ))


saveRDS(workouts, "workout-history.rds")
