exports.uploadSingleImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  res.status(200).json({
    success: true,
    url: req.file.path,
    publicId: req.file.filename
  });
};

exports.uploadMultipleImages = (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded'
    });
  }

  const urls = req.files.map(file => ({
    url: file.path,
    publicId: file.filename
  }));

  res.status(200).json({
    success: true,
    urls
  });
};
