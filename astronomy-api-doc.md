✨
Star Chart
Generates a star chart with the given parameters, and returns the url.

If you're looking to quickly integrate this feature on your website without making API calls, checkout Widgets

Generate star chart
POST https://api.astronomyapi.com/api/v2/studio/star-chart

Headers
Name
Type
Description
Authorization*

string

Basic <hash>

Request Body
Name
Type
Description
style

string

Style of the map to be generated. If not provided will use the default style. To see a demo of available styles see styles section on this page. 

observer*

object

Observer object must contain the latitude, longitude and date of the observer.

view*

object

View object is used to configure the view of the rendered image. The view object must contain a type and parameters object. Parameters object can vary based on the type.


200: OK

Copy
{
 "data": {
     "imageUrl": "https://widgets.astronomyapi.com/star-chart/generated/1234567890.png"
  }
}
Rendering different views
Constellation
To generate an image of a constellation the type in the view object must be set to constellation. The 3 letter ID of the constellation must be passed in the parameters for the view object. For a complete list of constellation IDs see Contellation Enums

The 3 letter constellation ID is case sensitive, only lower case is allowed


Copy
{
    "style": "inverted",
    "observer": {
        "latitude": 33.775867,
        "longitude": -84.39733,
        "date": "2019-12-20"
    },
    "view": {
        "type": "constellation",
        "parameters": {
            "constellation": "ori" // 3 letter constellation id
        }
    }
}
Area
To generate an image of an area in the sky, set the type to area, then pass the RA and Dec values in the position object for the view parameters. Currently equatorial coordinates are supported by the API. Additionally the parameter zoom can be provided to scale the image, but it's optional.


Copy
// Note how this request does not have the field `style` 
// The API will use the default style
{
    "observer": {
        "latitude": 33.775867,
        "longitude": -84.39733,
        "date": "2019-12-20"
    },
    "view": {
        "type": "area",
        "parameters": {
            "position": {
                "equatorial": {
                    "rightAscension": 14.83,
                    "declination": -15.23
                }
            },
            "zoom": 3 //optional
        }
    }
}
Styles
default

inverted

navy

red

🌒
Moon Phase
Generate an image of the Moon based on the given parameters.

If you're looking to quickly integrate this feature on your website without making API calls, checkout Widgets

Generate Moon Phase
POST https://api.astronomyapi.com/api/v2/studio/moon-phase

Headers
Name
Type
Description
Authorization*

string

Basic <hash>

Request Body
Name
Type
Description
format

string

Image format to be returned. Valid values are png or svg. Defaults to png

style

object

Style object contains the styling parameters for the image generated.

observer*

object

Observer object must contain the latitude, longitude and date of the observer. 

view*

object

View object is used to configure the view of the rendered image. The view object must contain a type object. 

orientation specifies which side of the moon should be up depending on the hemisphere you live in the world. This parameter is optional. If not provided AstronomyAPI will determine the values automatically.


200: OK

Copy
{
    "data": {
        "imageUrl": "https://widgets.astronomyapi.com/moon-phase/generated/1234567890.png"
    }
}

Copy
{
    "format": "png",
    "style": {
        "moonStyle": "sketch",
        "backgroundStyle": "stars",
        "backgroundColor": "red",
        "headingColor": "white",
        "textColor": "red"
    },
    "observer": {
        "latitude": 6.56774,
        "longitude": 79.88956,
        "date": "2020-11-01"
    },
    "view": {
        "type": "portrait-simple",
        "orientation": "south-up"
    }
}
Format
The API currently supports outputting images in svg and png formats. These can be used in different use cases, depending on how and where you want them to be displayed. 

Style
moonStyle
Valid values are default, sketch and shaded. Below are sample moons for each value.


default

shaded

sketch
backgroundStyle
Background style supports the values either stars or solid. Passing stars will render a stars background while solid will render the background with a solid color specified by the backgroundColor property.

backgroundColor, headingColor and textColor
These properties could be used to customise the image further. Colours could be defined as hex or as any of the 140 html colour names.

View
type
The type parameter in the view object should specify which template to be used when rendering the image. Currently two templates are available.


portrait-simple

landscape-simple
orientation
Orientation parameter in the view object, determines which orientation to use when rendering the moon. By default it will render north side up, as seen by an observer facing the south side of the sky. This parameter is optional.

Below is an example of the same image with different orientations.


north-up

south-up