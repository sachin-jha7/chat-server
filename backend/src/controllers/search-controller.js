import Friend from "../models/friend.js";
import User from "../models/user.js";

export const findUser = async (req, res) => {
    let { searchedName } = req.body;
    searchedName = searchedName.trim();
    const currentUserId = req.user.id;
    const isEmpty = searchedName.trim().length === 0;
    if (isEmpty) {
        return res.status(422).json("Invalid Data");
    }

    const hasWhiteSpace = /\s/.test(searchedName);
    if (hasWhiteSpace) {
        let searchableName = searchedName.trim().split(/\s+/);
        searchableName = searchableName.join(" ").toUpperCase();

        // 1. Find all relation documents where currentUserId is in the friends array
        const relationDocs = await Friend.find({ friends: currentUserId });

        // 2. Extract and flatten all user IDs from all returned relation documents
        const allFriendIds = relationDocs.flatMap(doc => doc.friends);

        // 3. Combine currentUserId and all friend IDs into a single exclusion set
        // (Using Set removes duplicate IDs automatically)
        const excludeIds = Array.from(new Set([currentUserId, ...allFriendIds.map(id => id.toString())]));

        // 4. Search users excluding yourself and existing friends
        const searchedUserDoc = await User.find({
            normalizedName: searchableName,
            _id: { $nin: excludeIds }
        });


        const currentUserDoc = await User.findById(currentUserId);
        const currUserReqSentArray = currentUserDoc.requestSent;

        const userResult = {
            searchedUserDoc,
            currUserReqSentArray
        }


        return res.status(200).json(userResult);

    } else {
        const searchedWords = searchedName.toUpperCase();

        // 1. Find all relation documents where currentUserId is in the friends array
        const relationDocs = await Friend.find({ friends: currentUserId });

        // 2. Extract and flatten all user IDs from all returned relation documents
        const allFriendIds = relationDocs.flatMap(doc => doc.friends);

        // 3. Combine currentUserId and all friend IDs into a single exclusion set
        // (Using Set removes duplicate IDs automatically)
        const excludeIds = Array.from(new Set([currentUserId, ...allFriendIds.map(id => id.toString())]));

        // 4. Search users excluding yourself and existing friends
        const searchedUserDoc = await User.find({
            keyWords: searchedWords,
            _id: { $nin: excludeIds }
        });

        const currentUserDoc = await User.findById(currentUserId);
        // console.log(currentUserDoc.requestSent);
        const currUserReqSentArray = currentUserDoc.requestSent;

        const userResult = {
            searchedUserDoc,
            currUserReqSentArray
        }


        return res.status(200).json(userResult);

        // return res.status(200).json(searchedUserDoc);
    }
}