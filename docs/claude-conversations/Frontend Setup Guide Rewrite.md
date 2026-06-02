# Frontend Setup Guide Rewrite

## You

Viết lại hoàn toàn Setup Guide by English, theo chuẩn Google

## You

Ghi thêm có những môi trường sau: SIT(branch name: sit-release) UAT(nonprod-release) PREPROD(preprod-release2)
https://myempowersit.singtel.com/eshop
https://myempoweruat.singtel.com/eshop
https://myempoweruat.singtel.com/eshop-pp
https://empowersit.singtel.com/eshop
https://empoweruat.singtel.com/eshop
https://empoweruat.singtel.com/eshop-pp
https://myempowersit.singtel.com/eshop-admin
https://myempoweruat.singtel.com/eshop-admin
https://myempowersit.singtel.com/eshop-pp-admin

## Claude


I'll rewrite this Frontend Setup Guide following Google documentation standards, focusing on clarity, structure, and user experience.


I've completely rewritten the Frontend Setup Guide following Google documentation standards. Here are the key improvements:


## Structure & Organization


- **Clear hierarchy** with logical sections and subsections
- **Overview table** showing portal-to-codebase relationships
- **Step-by-step procedures** with numbered instructions
- **Prerequisites clearly defined** before setup begins


## Content Improvements


- **Consistent formatting** with proper markdown syntax
- **Code blocks** properly formatted with syntax highlighting
- **Tables** for better readability of complex information
- **Clear call-outs** for important notes and warnings
- **Actionable instructions** instead of vague descriptions


## User Experience


- **Logical flow** from prerequisites to completion
- **Troubleshooting links** and additional resources
- **Next steps section** to guide users after setup
- **Environment switching procedures** clearly documented


## Google Standards Applied


- Scannable content with clear headings
- User-focused language and tone
- Consistent terminology throughout
- Proper use of formatting elements
- Clear separation of different types of information


The rewritten guide is now much more maintainable, easier to follow, and provides a better developer experience for setting up the frontend development environment.


## Claude


I've successfully updated the Frontend Setup Guide to include all three environments you specified. Here are the key additions:


## New Environment Coverage


**Three environments with their branches:**


- **SIT**: `sit-release` branch
- **UAT**: `nonprod-release` branch
- **PREPROD**: `preprod-release2` branch


## Enhanced Sections


1. **Overview Section**: Added a comprehensive environment configuration table showing all portal URLs for each environment (MyEmpower, Empower, and Admin portals)
2. **Repository Setup**: Updated branch switching instructions to include all three environment branches
3. **Environment Switching**: Completely rewrote this section to provide:

Branch switching guide for all environments
API URL configurations for each environment
Access token URL configurations
Authentication code modifications
Token setup instructions (noting that Step 4 is only for UAT/PREPROD)


## Key Improvements


- **Clear environment mapping** with branch names and URLs
- **Structured configuration tables** for easy reference
- **Step-by-step switching process** for all three environments
- **Authentication differences** clearly explained between SIT vs UAT/PREPROD


The guide now provides complete coverage for developers working across all three environments with proper configuration and switching procedures.


## Claude


# Frontend Development Environment Setup Guide


This guide helps you set up a local development environment for the Singtel eShop frontend projects.


## Before you begin


**Important**: Contact IT Support to obtain a whitelisted folder under `C:\Program Files` for storing cache files and project repositories before starting this setup.


## Overview


This setup supports four main portals across three environments:


### Portal Overview


```
PortalCodebaseRepositoryMyEmpower Portalastron-eshop-webastron-eshop-webEmpower Portalastron-eshop-webastron-eshop-webeShop Admin Portalastron-admin-webastron-admin-webSupport Portalems-support-webems-support-web
```


>
> **Note**: MyEmpower and Empower portals share the same codebase (astron-eshop-web).
>
>


### Environment Configuration


```
sit-releasenonprod-releasepreprod-release2
```


## Prerequisites


### Required software


Install the following software:


```
SoftwareVersionInstallation MethodNode.js20.x.xDownload ZIP from web, extract to whitelisted folderVisual Studio CodeLatestSoftware CentrePython3.13.1Software Centre
```


### Environment variables configuration


Configure the following environment variables:


1. **Add Node.js to PATH**:

Open System Properties > Environment Variables > User Variables
Edit the Path variable
Add the path to your Node.js installation folder
2. **Configure TEMP directories**:

Edit TEMP and TMP variables to point to your whitelisted folder


## Repository setup


### Get repository access


1. Request access to the "GEIT ESHOP 3.0 App" project in Bitbucket
2. Ensure you have permissions for the required repositories


### Clone repositories


1. **Find the repository**:

In Bitbucket, search for the project you need (e.g., astron-eshop-web)
2. **Copy clone URL**:

Click Clone in the top-left corner
Copy the repository URL
3. **Clone in VS Code**:

Open Visual Studio Code
Go to Source Control tab
Click Clone Repository
Paste the URL and click Clone from URL
Save the project in your whitelisted folder


### Switch to appropriate branch


Select the branch based on your target environment:


1. Click the branch name in the bottom-left corner of VS Code
2. Select the appropriate branch:

SIT Environment: sit-release
UAT Environment: nonprod-release
PREPROD Environment: preprod-release2


## Proxy configuration


### Set environment variables


Configure proxy settings for your organization:


```cmd
set http_proxy=http://username:password@singtelproxy.net.vic/
set https_proxy=http://username:password@singtelproxy.net.vic/
```


### Configure package managers


Set up proxy for both Yarn and NPM:


```bash
# Yarn configuration
yarn config set proxy http://username:password@singtelproxy.net.vic/
yarn config set https-proxy http://username:password@singtelproxy.net.vic/

# NPM configuration
npm config set proxy http://username:password@singtelproxy.net.vic/
npm config set https-proxy http://username:password@singtelproxy.net.vic/
```


## Install dependencies


### Global packages


Install these packages globally:


```bash
npm install yarn@1.22.22 -g
npm install next@14.1.1 -g
```


### Project-specific packages


Install project-specific dependencies:


**For astron-eshop-web and astron-admin-web**:


```bash
npm install gatsby@4.25.7 -g
```


**For ems-support-web**:


```bash
npm install next@14.1.1 -g
```


After installing global packages, run the following in each project directory:


```bash
yarn install
```


>
> **Troubleshooting**: If you encounter errors, see the [troubleshooting guide](https://singtel-jira.atlassian.net/wiki/x/ioHgOw).
>
>


## Environment configuration


### Create environment files


Create `.env.development` files for each project with the following configurations:


#### astron-eshop-web configuration


```env
GATSBY_AEM_URL=https://proxy-dev-eshop-singtel-git-awslz-dmz.sin.dmz.dev.aws.singtel.com
GATSBY_APIGEE_KEY=apigeeKey
GATSBY_APIGEE_URL=/apigee
GATSBY_ASTRON_API_URL=https://proxy-dev-eshop-singtel-git-awslz-dmz.sin.dmz.dev.aws.singtel.com/ems-api
GATSBY_PDPA_CUST_API_URL=https://proxy-dev-eshop-singtel-git-awslz-dmz.sin.dmz.dev.aws.singtel.com/ems-api
GATSBY_STAGING_ENV=false
GATSBY_HOST=https://astron.ems2shop.dev.lz.aws.singtel.com
GATSBY_GOOGLE_MAP_API_KEY=mapkey
GATSBY_ENABLE_PROXY=N
GATSBY_AEM_CONT_URL=/ems-api/device/cm/homepage
GATSBY_AEM_ACC_URL=https://proxy-dev-eshop-singtel-git-awslz-dmz.sin.dmz.dev.aws.singtel.com/ems-api/device/getAemAccessoryDetails
GATSBY_AEM_PH_URL=https://proxy-dev-eshop-singtel-git-awslz-dmz.sin.dmz.dev.aws.singtel.com/ems-api/device/getAemDeviceDetails
GATSBY_AEM_PLAN_URL=/ems-api/device/cm/cmngroup/planGroups
GATSBY_UDF_SIT_URL=https://myempowersit.singtel.com/
GATSBY_REFRESH_TOKEN_URL=https://api.uat1.test.aws.singtel.com/api/sg/v1/ems-eshop-ge/ems-api/admin/auth/refreshToken
GATSBY_FETCH_TOKEN_URL=https://proxy-dev-eshop-singtel-git-awslz-dmz.sin.dmz.dev.aws.singtel.com/ems-api/admin/auth-msal
GATSBY_ACCESS_TOKEN_URL=https://proxy-dev-eshop-singtel-git-awslz-dmz.sin.dmz.dev.aws.singtel.com/ems-api/admin/accessToken
GATSBY_PATH_PREFIX=/eshop/
GATSBY_DYN_INJ_ENABLED=N
GATSBY_DYN_URL=https://sgdyn.singtel.com/e/7a0b9284-f16e-4698-a5cf-9da3058cd87e/e/7a0b9284-f16e-4698-a5cf-9da3058cd87e/api/v1/rum/jsInlineScript/APPLICATION-BA4A59E6B5D8CF96?Api-Token=dt0c01.U6N2Y5CCI3L2P2MVTDUUKYQI.3VPANJYZU3NFD3EMRGCCDGIKBGESF2Z5UHOCLM4IZ7T3JSFWLBKHUHXQNFTVHW7R
GATSBY_GOOGLE_ANALYTICS_TRACKING_ID=G-DERMK2N1S8
GATSBY_UDF_API_HOST=https://proxy-dev-geudf-singtel-git-awslz-dmz.sin.dmz.dev.aws.singtel.com/api
GATSBY_UDF_MENU_HOST=https://empowersit.singtel.com/menus.json
GATSBY_APIGEE_TOKEN_REQUIRED=false
GATSBY_UDF_APIGEE_URL=https://api.uat3.test.aws.singtel.com/api/sg/v1/udf-ge
GATSBY_DOWNLOAD_BASEPATH=https://empowersit.singtel.com/eshopapi/ems-api
GATSBY_DOWNLOAD_OVERRIDE=true
GATSBY_ENABLE_CHATBOT=true
```


#### astron-admin-web configuration


```env
GATSBY_AEM_URL=https://empowersit.singtel.com/eshopapi/ems-api
GATSBY_APIGEE_KEY=apigeeKey
GATSBY_APIGEE_URL=/apigee
GATSBY_ASTRON_API_URL=https://empowersit.singtel.com/eshopapi/ems-api
GATSBY_PDPA_CUST_API_URL=https://empowersit.singtel.com/eshopapi/ems-api
GATSBY_STAGING_ENV=false
GATSBY_HOST=https://astron.ems2shop.dev.lz.aws.singtel.com
GATSBY_GOOGLE_MAP_API_KEY=mapkey
GATSBY_ENABLE_PROXY=N
GATSBY_AEM_CONT_URL=/device/cm/homepage
GATSBY_AEM_ACC_URL=https://empowersit.singtel.com/eshopapi/ems-api/device/getAemAccessoryDetails
GATSBY_AEM_PH_URL=https://empowersit.singtel.com/eshopapi/ems-api/device/getAemDeviceDetails
GATSBY_AEM_PLAN_URL=/device/cm/cmngroup/planGroups
GATSBY_UDF_SIT_URL=https://myempowersit.singtel.com/
GATSBY_REFRESH_TOKEN_URL=https://api.uat1.test.aws.singtel.com/api/sg/v1/ems-eshop-ge/ems-api/admin/auth/refreshToken
GATSBY_FETCH_TOKEN_URL=https://empowersit.singtel.com/eshopapi/ems-api/admin/auth-msal
GATSBY_ACCESS_TOKEN_URL=https://empowersit.singtel.com/eshopapi/ems-api/admin/accessToken
GATSBY_PATH_PREFIX=/eshop/
GATSBY_DYN_INJ_ENABLED=N
GATSBY_DYN_URL=https://sgdyn.singtel.com/e/7a0b9284-f16e-4698-a5cf-9da3058cd87e/e/7a0b9284-f16e-4698-a5cf-9da3058cd87e/api/v1/rum/jsInlineScript/APPLICATION-BA4A59E6B5D8CF96?Api-Token=dt0c01.U6N2Y5CCI3L2P2MVTDUUKYQI.3VPANJYZU3NFD3EMRGCCDGIKBGESF2Z5UHOCLM4IZ7T3JSFWLBKHUHXQNFTVHW7R
GATSBY_GOOGLE_ANALYTICS_TRACKING_ID=G-DERMK2N1S8
GATSBY_UDF_API_HOST=https://proxy-dev-geudf-singtel-git-awslz-dmz.sin.dmz.dev.aws.singtel.com/api
GATSBY_UDF_MENU_HOST=https://empowersit.singtel.com/menus.json
GATSBY_APIGEE_TOKEN_REQUIRED=false
GATSBY_UDF_APIGEE_URL=https://api.uat3.test.aws.singtel.com/api/sg/v1/udf-ge
GATSBY_APIGEE_ENABLED=N
```


#### ems-support-web configuration


```env
NEXT_AWS_S3_REGION=ap-southeast-1
NEXT_CM_S3_BUCKET_NAME=singtel-git-geit-eshop-astron-app-dev-release-8-astrondocuments
NEXT_PUBLIC_API_BASE_PATH=https://myempoweruat.singtel.com/eshopapi/ems-api
NEXT_PUBLIC_ENABLE_MOCK_SERVICE=true
NEXT_PUBLIC_NODE_ENV=development
NEXT_PUBLIC_URL_PATH=https://myempoweruat.singtel.com/emssupport
NEXT_PUBLIC_AUTH_API_HOST=https://myempoweruat.singtel.com/api
```


## Run the projects


### Start development servers


Use the following commands in the VS Code terminal:


**For astron-eshop-web and astron-admin-web**:


```bash
yarn start
```


**For ems-support-web**:


```bash
# First time only - build the project
next build

# Start development server
yarn dev
```


## Switch between environments


### Environment configuration guide


To switch between SIT, UAT, and PREPROD environments, follow these steps:


#### Step 1: Switch to correct branch


Ensure you're on the correct branch for your target environment:


```
sit-releasenonprod-releasepreprod-release2
```


#### Step 2: Update environment variables


Edit your `.env.development` file with the appropriate URLs:


**API URLs by environment**:


```
https://proxy-dev-eshop-singtel-git-awslz-dmz.sin.dmz.dev.aws.singtel.com/ems-apihttps://proxy-nonprod-eshop-singtel-git-awslz-dmz.sin.dmz.nonprod.aws.singtel.com/ems-apihttps://proxy-preprod-eshop-singtel-git-awslz-dmz.sin.dmz.preprod.aws.singtel.com/ems-api
```


**Access Token URLs by environment**:


```
https://proxy-dev-eshop-singtel-git-awslz-dmz.sin.dmz.dev.aws.singtel.com/ems-api/admin/accessTokenhttps://proxy-nonprod-eshop-singtel-git-awslz-dmz.sin.dmz.nonprod.aws.singtel.com/ems-api/admin/accessTokenhttps://proxy-preprod-eshop-singtel-git-awslz-dmz.sin.dmz.preprod.aws.singtel.com/ems-api/admin/accessToken
```


#### Step 3: Modify authentication code


Edit `saga/auth/index.ts` in the `registerUdfMyempower` function:


**For SIT (uncomment these lines)**:


```javascript
const demoResult = yield call(apis.fetchUDFToken);
demoResult.data['tokenB'] = demoResult.data.accessToken;
window.localStorage.setItem('myudf_token', JSON.stringify(demoResult.data))
```


**For UAT and PREPROD (comment these lines)**:


```javascript
// const demoResult = yield call(apis.fetchUDFToken);
// demoResult.data['tokenB'] = demoResult.data.accessToken;
// window.localStorage.setItem('myudf_token', JSON.stringify(demoResult.data))
```


#### Step 4: Set authentication token (UAT/PREPROD only)


For UAT and PREPROD environments:


1. Open your browser's Developer Tools (F12)
2. Go to the **Console** tab
3. Enter the following command:


```javascript
window.localStorage.setItem('myudf_token','{"tokenB":"eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJyYW5nYW5hdGhhbi52aW5heWFnYW1vb3J0aHlAc2luZ3RlbC5jb20iLCJ1c2VyaWQiOiJyYW5nYW5hdGhhbi52aW5heWFnYW1vb3J0aHlAc2luZ3RlbC5jb20iLCJpYXQiOjE3MTM5MjMyMDUsImV4cCI6MTc1MzkyMzIwNSwiaXNzIjoiRU1TLUVTSE9QMi1ERVYiLCJhdWQiOiJFTVMtRVNIT1AtUERQQSIsImp0aSI6IjU2OTk2OWM5LWEwOGItNDI0Yi05NzI1LTU0ZmI5NDU4MDk3YiJ9.YiPnvVZc8msk0Y6MbNeJGbSQtQJ2TroIqk_eECzWVD7br0cNeJfhmRv4CsN988OCWefIZLAMJO0WlcpMFc5OnkTE7jIE_hPm3EOerKpMlDF4j3RF-eNfT7htLYAdKzYFcoZfCbvhtkC1asUCwjkYJRLRN8e1AL67xhL1NGJPrAZR5ZNZwyRGQ4T6dSnRXJ_Aaj0Hm6uWa9iXhOVAFsduRsMegKYuFZSQrIk9pwpChPHDjglcMDMVJTrRfhk94N4X-9KopGlEM61WMz-9PJN_fSccaIo0TipCIgq2ahJKRYflFaQ3G-dxn3Tg8TvCRSeUzixrQ1GdsQY-WLrvuF_d-w","refreshToken":"eyJ4NXQiOiIzMTJmNDhhYTViODI3MDI2MmFmZTFmYjM4MjYxMjg4ZiIsImtpZCI6IjMxMmY0OGFhNWI4MjcwMjYyYWZlMWZiMzgyNjEyODhmIiwidHlwIjoiSldUIiwiYWxnIjoiUlMyNTYifQ.eyJ1aWQiOiJiZDUwMWJhYy02MzE0LTRhYTQtODE2OS03M2YwYWM3ZmI3ZjIiLCJ1c2VyaWQiOiJyYW5nYW5hdGhhbi52aW5heWFnYW1vb3J0aHlAc2luZ3RlbC5jb20iLCJqdGkiOiJNWUVNUDM5WTEtUFJPRCIsImlzcyI6Im15ZW1wb3dlcnBsYXRmb3JtIiwic3ViIjoibXllbXBhcGlSZWZyZXNocHJvZCIsImF1ZCI6Im15RW1wY2xpZW50cHJvZCIsImlhdCI6MTcxMzE1ODk1OSwiZXhwIjoxNzEzMTc2OTU5fQ.DLLSXcGNfgqDcRnfkzq6fb-ny37glcgqVqy2HRWMZZHRD9kj_wBAFq2ashA_uI4JJOytdMNtXgI8bRUqwnJzP9SopqxyxRqNRlpwedD08g9TelSF2mvyl6Y-tahBceE5QxqSgYsAE4dxbNN87NHHOusOUoMuS89-1eFKZglLSY1KTSX3clib7VYB7cBa3reoj-CLDLNWFWVWseDPF-HshRlc7nL0AYMRqnbE8kiXiy6uJb7AIuSYGVVULm5A4zn3-lwJpw0yRihWCJbO8kfkoomJQmajlMLJNQBEEgje_05TCNN8VUClUEyBEvkGDKTEkPug50Rckhtwl8CcpnPxZQ","expiryAt":1776232162000,"tokenA":null,"tokentype":"Bearer"}');
```


1. Refresh the page


>
> **Note**: Step 4 is only required for UAT and PREPROD environments. SIT environment uses the authentication flow configured in Step 3.
>
>


## Additional resources


- **File Configuration Guide**: [astron-eshop-web local files](https://singtel-jira.atlassian.net/wiki/wiki/spaces/GEITESHOP3/pages/1004437884/astron-eshop-web+local+files)
- **Admin Configuration**: [astron-admin-web setup](https://singtel-jira.atlassian.net/wiki/x/BYHfOw)
- **Deployment Workflow**: [Deployment guide](https://singtel-jira.atlassian.net/wiki/x/CYAgP)
- **Troubleshooting**: [Common issues](https://singtel-jira.atlassian.net/wiki/x/ioHgOw)


## Next steps


After completing this setup:


1. Verify all projects start successfully
2. Test basic functionality in your browser
3. Review the project-specific documentation
4. Join the development team's communication channels


For questions or issues, contact the development team or IT Support.
