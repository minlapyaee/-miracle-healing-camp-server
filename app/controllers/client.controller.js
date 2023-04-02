const Post = require("../models/post.model");
const SavedPost = require("../models/savedpost.model");
const Comment = require("../models/comment.model");
const Appointment = require("../models/appointment.model");
const Meet = require("../models/meet.model");
const Customer = require("../models/customer.model");
const Like = require("../models/like.model");
const jwt = require("jsonwebtoken");

const payload = {
  iss: process.env.ZOOM_API_KEY, //your API KEY
  exp: new Date().getTime() + 5000,
};
const token = jwt.sign(payload, process.env.ZOOM_API_SECRET);

exports.create_post = async (req, res) => {
  const { title, content, type } = req.body;
  try {
    const permalink = title.toString().toLowerCase().replaceAll(/[" "]/g, "-");
    const post = new Post({
      title,
      content,
      type,
      permalink,
      created_by: req.user.id,
    });
    return post.save(async (err, data) => {
      if (err) {
        return res.status(302).send({ success: false, message: err });
      }
      return res.status(200).send({ message: "success", success: true, data });
    });
  } catch (err) {
    console.log("err", err);
    return res.json({ message: "something went wrong", success: false });
  }
};

exports.fetchPost = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({
        created_at: "descending",
      })
      .populate({
        path: "created_by",
        model: "User",
        select: "id fullname",
      });

    let data = [];
    let finalData = data;
    posts.map(async (post) => {
      data.push(
        new Promise(async (resolve, reject) => {
          let like = [];
          let savedPost = [];
          if (req.user) {
            like = await Like.find({
              post_id: post._id,
              created_by: req.user._id,
            });
            savedPost = await SavedPost.find({
              post_id: post._id,
              created_by: req.user._id,
            });
          }
          let likeCount = await Like.find({ post_id: post._id }).count();
          let commentCount = await Comment.find({ post_id: post._id }).count();
          resolve({
            post,
            isLike: like.length > 0 ? true : false,
            isSavedPost: savedPost.length > 0 ? true : false,
            likeCount,
            commentCount,
          });
        })
      );
    });

    finalData = await Promise.all(data);

    return res.json({
      message: "success",
      success: true,
      data: finalData,
    });
  } catch (err) {
    console.log(err);
    return res.json({ message: "something went wrong", success: false });
  }
};

// exports.fetchSavedPost = async (req, res) => {
//   try {
//     const posts = await SavedPost.find({created_by: req.user.id  })
//       .sort({
//         created_at: "descending",
//       })
//       .populate({
//         path: "created_by",
//         model: "User",
//         select: "id fullname",
//       });
//       console.log(posts)
//     let data = [];
//     let finalData = data;
//           return res.status(200).send({ message: "success", success: true, data });
//   } catch (err) {
//     console.log(err);
//     return res.json({ message: "something went wrong", success: false });
//   }
// };
exports.createComment = async (req, res) => {
  const { content, post_id, post_owner_id } = req.body;
  try {
    const comment = new Comment({
      content,
      post_id,
      created_by: req.user.id,
    });

    return comment.save(async (err, data) => {
      if (err) {
        return res.status(302).send({ success: false, message: err });
      }
      if (post_owner_id !== req.user.id) {
        //   await Notification.create({
        //     noti_type: "comment",
        //     post_id,
        //     sender_id: req.user.id,
        //     receiver_id: post_owner_id,
        //   });
      }

      return res.status(200).send({ message: "success", success: true, data });
    });
  } catch (err) {
    console.log("err", err);
    return res.json({ message: "something went wrong", success: false });
  }
};

exports.fetchPostDetail = async (req, res) => {
  const { id } = req.query;
  try {
    const post = await Post.findById(id).populate({
      path: "created_by",
      model: "User",
      select: "id fullname",
    });
    let like = [];
    let savedPost = [];
    let likeCount = await Like.find({ post_id: post._id }).count();
    let commentCount = await Comment.find({ post_id: post._id }).count();
    if (req.user) {
      like = await Like.find({
        post_id: post._id,
        created_by: req.user._id,
      });
      savedPost = await SavedPost.find({
        post_id: post._id,
        created_by: req.user._id,
      });

    }
    return res.json({
      message: "success",
      success: true,
      data: {
        post,
        isLike: like.length > 0 ? true : false,
        isSavedPost: savedPost.length > 0 ? true : false,
        likeCount,
        commentCount
      },
    });
  } catch (err) {
    console.log(err);
    return res.json({ message: "something went wrong", success: false });
  }
};

exports.createsavedPost = async (req, res) => {
  try {
    const { post_id } = req.body;
    SavedPost.findOneAndDelete(
      { post_id, created_by: req.user.id },
      function (err, doc) {
        if (err) {
          console.log("err", err);
          return res.json({ message: "something went wrong", success: false });
        }
        if (!doc) {
          const savedPostData = new SavedPost({
            created_by: req.user.id,
            post_id,
          });
          return savedPostData.save(async (err, data) => {
            if (err) {
              return res.status(302).send({ success: false, message: err });
            }

            return res
              .status(200)
              .send({ message: "success", success: true, data });
          });
        }
      }
    );
  } catch (err) {
    console.log("err", err);
    return res.json({ message: "something went wrong", success: false });
  }
};

exports.fetchSavedPost = async (req, res) => {
  try {
    const posts = await SavedPost.find({ created_by: req.user.id }).populate({
      path: "post_id",
      model: "Post",
      select: "id title content permalink type created_by created_at",
      populate: {
        path: "created_by",
        model: "User",
        select: "id fullname",
      },
    });
    
    console.log(posts)

    let data = [];
    let finalData = data;
    posts.map(async (post) => {
      data.push(
        new Promise(async (resolve, reject) => {
          let like = [];
          let savedPost = [];
          if (req.user) {
            like = await Like.find({
              post_id: post.post_id._id,
              created_by: req.user._id,
            });
            savedPost = await SavedPost.find({
              post_id: post.post_id._id,
              created_by: req.user._id,
            });
          }
          let likeCount = await Like.find({ post_id: post.post_id._id }).count();
          let commentCount = await Comment.find({ post_id: post.post_id._id }).count();
          resolve({
            post,
            isLike: like.length > 0 ? true : false,
            isSavedPost: savedPost.length > 0 ? true : false,
            likeCount,
            commentCount,
          });
        })
      );
    });

    finalData = await Promise.all(data);
    return res.json({ message: "success", success: true, data: finalData });
  } catch (err) {
    console.log('err', err)
    return res.json({ message: "something went wrong", success: false });
  }
};

exports.fetchComment = async (req, res) => {
  const { post_id } = req.query;
  try {
    const data = await Comment.find({ post_id })
      .sort({
        createdAt: "descending",
      })
      .populate({
        path: "created_by",
        model: "User",
        select: "id fullname",
      });
    return res.json({ message: "success", success: true, data });
  } catch (err) {
    console.log("err", err);
    return res.json({ message: "something went wrong", success: false });
  }
};

exports.createLike = async (req, res) => {
  try {
    const { post_id, post_owner_id } = req.body;

    Like.findOneAndDelete(
      { post_id, created_by: req.user.id },
      function (err, doc) {
        if (err) {
          return res.json({ message: "something went wrong", success: false });
        }
        if (!doc) {
          const like = new Like({
            post_id,
            created_by: req.user.id,
          });
          return like.save(async (err, data) => {
            if (err) {
              return res.status(302).send({ success: false, message: err });
            }
            if (post_owner_id !== req.user.id) {
              //   await Notification.create({
              //     noti_type: "like",
              //     post_id,
              //     sender_id: req.user.id,
              //     receiver_id: post_owner_id,
              //   });
            }

            return res
              .status(200)
              .send({ message: "success", success: true, data });
          });
        }
        return res.status(200).send({ message: "success", success: true });
      }
    );

    // return like.save(async (err, data) => {
    //     if (err) {
    //       return res.status(302).send({ success: false, message: err });
    //     }
    //     if (post_owner_id !== req.user.id) {
    //       //   await Notification.create({
    //       //     noti_type: "like",
    //       //     post_id,
    //       //     sender_id: req.user.id,
    //       //     receiver_id: post_owner_id,
    //       //   });
    //     }

    //     return res.status(200).send({ message: "success", success: true, data });
    //   });
  } catch (err) {
    console.log("err", err);
    return res.json({ message: "something went wrong", success: false });
  }
};

exports.createAppointment = async (req, res) => {
  const data = req.body;

  try {
    const appointment = new Appointment({
      ...data,
      requested_by: req.user.id,
      status: "pending",
    });

    return appointment.save(async (err, data) => {
      return res.json({ message: "success", data });
    });
  } catch (err) {
    console.log("err", err);
    return res.json({ message: "something went wrong", success: false });
  }
};

exports.checkAppointment = async (req, res) => {
  try {
    const data = await Appointment.findOne({ requested_by: req.user.id }).sort({
      createdAt: -1,
    });
    if (data?.status === "progress") {
      const meeting = await Meet.findOne({ user_id: data.requested_by }).sort({
        created_at: -1,
      });
      return res.json({ message: "success", data, meeting });
    }
    return res.json({ message: "success", data });
  } catch (err) {
    console.log("err", err);
    return res.json({ message: "something went wrong", success: false });
  }
};

exports.registerCustomer = async (req, res) => {
  const { image } = req.body;

  try {
    const data = await Customer.find({
      created_by: req.user.id,
      $or: [{ status: "pending" }, { status: "verified" }],
    });
    if (data.length === 0) {
      const appointment = new Customer({
        created_by: req.user.id,
        status: "pending",
        image,
      });

      return appointment.save(async (err, data) => {
        return res.json({ message: "success", data });
      });
    }
    return res.json({ message: "existed", data });
  } catch (err) {
    console.log("err", err);
    return res.json({ message: "something went wrong", success: false });
  }
};

exports.checkPurchasedPackage = async (req, res) => {
  try {
    const data = await Customer.findOne({
      created_by: req.user.id,
      $or: [{ status: "pending" }, { status: "verified" }],
    });
    return res.json({ message: "success", data });
  } catch (err) {
    console.log("err", err);
    return res.json({ message: "something went wrong", success: false });
  }
};
