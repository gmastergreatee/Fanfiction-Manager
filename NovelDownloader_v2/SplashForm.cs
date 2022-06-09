using System;
using System.Windows.Forms;

namespace NovelDownloader_v2
{
    public partial class SplashForm : FormWrapper
    {
        public SplashForm()
        {
            InitializeComponent();
            Icon = Properties.Resources.AppIcon;
        }
    }
}
