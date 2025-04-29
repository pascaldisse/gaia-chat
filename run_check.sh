#!/bin/bash

# Run the comparison script to check if all files match now
echo "Checking if all source files now match build output..."
chmod +x compare_build.sh
./compare_build.sh

if [ $? -eq 0 ]; then
  echo -e "\033[0;32mSuccess! All source files match the build output.\033[0m"
  echo "You can now run ./restart.sh to build and start the application."
  exit 0
else
  echo -e "\033[0;31mSome files still don't match. Additional fixes may be needed.\033[0m"
  exit 1
fi
