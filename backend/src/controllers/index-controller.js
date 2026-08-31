import User from "../models/user.js";
import Friend from "../models/friend.js";

export const fetchData = async (req, res) => {
    const userId = req.user.id;
    const userDoc = await User.findById(userId);
    const user = await User.findById(userId)
        .select('myNotifications')
        .populate('myNotifications', 'fullName imageUrl');

    const notifications = user.myNotifications;


    const allFriendshipArray = await Friend.find({
        friends: userId
    }).populate("friends", "fullName imageUrl");

    // allFriendshipArray will return data something like 
    // = [{ friends: [{ data1 }, { data2 }] }, { friends: [{ data3 }, { data4 }]}]

    const flatArray = allFriendshipArray.flatMap(item => item.friends); // this will make them [{data1},{data2},{data3},{data4}]
    // console.log(flatArray)

    // Removing current user, the frindShip array is like: A <--> B , A <--> C, A <--> D etc., so removing A
    const filteredResult = flatArray.filter(item => item._id != userId); // only those user which are friend of current user
    // console.log(filteredResult)

    const currUserData = {
        fullName: userDoc.fullName,
        imageUrl: userDoc.imageUrl,
        currentUser: userDoc._id,
        myNotifications: notifications,
        friendsList: filteredResult
    }
    res.status(200).json(currUserData);
}