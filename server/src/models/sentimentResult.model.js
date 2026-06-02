const mongoose = require('mongoose');

const sentimentResultSchema = new mongoose.Schema({
  tourId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true, unique: true },
  positiveCount: { type: Number, default: 0 },
  neutralCount: { type: Number, default: 0 },
  negativeCount: { type: Number, default: 0 },
  averageSentimentScore: { type: Number, default: 0 },
  lastUpdatedAt: { type: Date }
}, {
  timestamps: true
});

sentimentResultSchema.statics.recalculateForTour = async function(tourId) {
  try {
    const Review = mongoose.model('Review');
    const reviews = await Review.find({
      tourId,
      sentiment: { $ne: 'pending' }
    });

    let p = 0, n = 0, neg = 0, totalScore = 0;
    reviews.forEach(r => {
      if (r.sentiment === 'positive') p++;
      else if (r.sentiment === 'neutral') n++;
      else if (r.sentiment === 'negative') neg++;
      totalScore += (r.sentimentScore || 0);
    });

    const count = p + n + neg;
    const avg = count > 0 ? totalScore / count : 0;

    await this.findOneAndUpdate(
      { tourId },
      {
        tourId,
        positiveCount: p,
        neutralCount: n,
        negativeCount: neg,
        averageSentimentScore: avg,
        lastUpdatedAt: new Date()
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error("Sentiment recalculation failed:", err);
  }
};

module.exports = mongoose.model('SentimentResult', sentimentResultSchema);
