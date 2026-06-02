const mongoose = require('mongoose');

const recommendationCacheSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    recommendedTours: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tour'
      }
    ]
  },
  {
    timestamps: true
  }
);

// Map high-performance fetching arrays natively 
recommendationCacheSchema.index({ userId: 1 });

module.exports = mongoose.model('RecommendationCache', recommendationCacheSchema);
