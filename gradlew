#!/bin/sh
#
# Gradle start up script for UN*X
#

# Attempt to set APP_HOME
APP_HOME=$(cd "$(dirname "$0")" && pwd)

CLASSPATH=$APP_HOME/gradle/wrapper/gradle-wrapper.jar

exec java -classpath "$CLASSPATH" \
    -Xmx64m \
    -Xms64m \
    org.gradle.wrapper.GradleWrapperMain "$@"
