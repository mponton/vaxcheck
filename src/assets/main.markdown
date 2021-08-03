## What is this app?

This web application allows you to decode the QR code of vaccination cards/passes from some countries/regions to display the data they contain and when possible verify that the pass is valid. This is really a personal side project and by no means should be used to replace any official government applications. Use the **About** button above if you would like more info.

This app was designed for phones first and it's my first ever web app so it will look a bit weird on tablets and desktop but it works on them nonetheless.

***NOTE: Scroll down for known issues.***

## Camera Access

In order for the application to use the camera, ***you must allow access*** when prompted in your browser the first time you use it. If you deny access you will not get prompted again and will have to manually re-enable access in your browser. How this is done depends on the browser and platform you use.

## Security & Privacy

This application is a "Single Page App" (SPA) that runs ***ENTIRELY*** in your browser and does ***NOT*** communicate or transmit any information to any website once loaded. You can *somewhat* confirm this on mobile by putting your phone/tablet in airplane mode after loading the application. You will be able to use it without any Internet access. The source code for the application is also available for review on [GitHub](https://github.com/mponton/vaxcheck).

## Add to your Home Screen

On mobile you can add this web application on your home screen using on of these methods:

* [iOS (iPhone/iPad)](https://www.howtogeek.com/667910/how-to-add-a-website-to-your-iphone-or-ipad-home-screen/)
* [Android](https://www.howtogeek.com/667938/how-to-add-a-website-to-your-android-home-screen/)

## Supported Issuers

| Country | Region     | Format    | Valid. | Added On   | Tested |
| ------- | ---------- | --------- | ------ | ---------- | ------ |
| Canada  | Quebec     | SHC       | Yes    | 2021-07-30 | Yes    |
| USA     | California | SHC       | Yes    | 2021-07-30 | No     |
| USA     | New York   | Excelsior | No     | 2021-07-31 | Yes    |
| France  |            | EU DGP    |        | *Planned*  |        |

## Known Issues

* Scanning a QR code from an image does not work as well as with the camera. It's really hit-or-miss and seems to work better if the image is an actual photo instead of a screen capture.

## Support

This application is free and was developed as a side project so really, there is no official support of any kind for it. Sorry. That said, if you have comments or if you'd like me to add support for other issuers, you can reach out via [email](mailto:marco@vaxcheck.app). For me to add support for a new issuer, I will need test and/or legitimate QR codes. This may mean sharing your full name and date of birth in addition to vaccination information with me.

*If you are a developer and want to help, feel free to open a ticket and/or pull request via GitHub.*
